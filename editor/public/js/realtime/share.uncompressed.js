(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sharejs = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Doc = require('./doc').Doc;
var Query = require('./query').Query;
var emitter = require('./emitter');


/**
 * Handles communication with the sharejs server and provides queries and
 * documents.
 *
 * We create a connection with a socket object
 *   connection = new sharejs.Connection(sockset)
 * The socket may be any object handling the websocket protocol. See the
 * documentation of bindToSocket() for details. We then wait for the connection
 * to connect
 *   connection.on('connected', ...)
 * and are finally able to work with shared documents
 *   connection.get('food', 'steak') // Doc
 *
 * @param socket @see bindToSocket
 */
var Connection = exports.Connection = function (socket) {
  emitter.EventEmitter.call(this);

  // Map of collection -> docName -> doc object for created documents.
  // (created documents MUST BE UNIQUE)
  this.collections = {};

  // Each query is created with an id that the server uses when it sends us
  // info about the query (updates, etc).
  //this.nextQueryId = (Math.random() * 1000) |0;
  this.nextQueryId = 1;

  // Map from query ID -> query object.
  this.queries = {};

  // State of the connection. The correspoding events are emmited when this
  // changes. Available states are:
  // - 'connecting'   The connection has been established, but we don't have our
  //                  client ID yet
  // - 'connected'    We have connected and recieved our client ID. Ready for data.
  // - 'disconnected' The connection is closed, but it will reconnect automatically.
  // - 'stopped'      The connection is closed, and should not reconnect.
  this.state = 'disconnected';

  // This is a helper variable the document uses to see whether we're currently
  // in a 'live' state. It is true if we're connected, or if you're using
  // browserchannel and connecting.
  this.canSend = false;

  // Private variable to support clearing of op retry interval
  this._retryInterval = null;

  // Reset some more state variables.
  this.reset();

  this.debug = false;

  // I'll store the most recent 100 messages so when errors occur we can see
  // what happened.
  this.messageBuffer = [];

  this.bindToSocket(socket);
}
emitter.mixin(Connection);


/**
 * Use socket to communicate with server
 *
 * Socket is an object that can handle the websocket protocol. This method
 * installs the onopen, onclose, onmessage and onerror handlers on the socket to
 * handle communication and sends messages by calling socket.send(msg). The
 * sockets `readyState` property is used to determine the initaial state.
 *
 * @param socket Handles the websocket protocol
 * @param socket.readyState
 * @param socket.close
 * @param socket.send
 * @param socket.onopen
 * @param socket.onclose
 * @param socket.onmessage
 * @param socket.onerror
 */
Connection.prototype.bindToSocket = function(socket) {
  if (this.socket) {
    delete this.socket.onopen
    delete this.socket.onclose
    delete this.socket.onmessage
    delete this.socket.onerror
  }

  // TODO: Check that the socket is in the 'connecting' state.

  this.socket = socket;
  // This logic is replicated in setState - consider calling setState here
  // instead.
  this.state = (socket.readyState === 0 || socket.readyState === 1) ? 'connecting' : 'disconnected';
  this.canSend = this.state === 'connecting' && socket.canSendWhileConnecting;
  this._setupRetry();

  var connection = this

  socket.onmessage = function(msg) {
    var data = msg.data;

    // Fall back to supporting old browserchannel 1.x API which implemented the
    // websocket API incorrectly. This will be removed at some point
    if (!data) data = msg;

    // Some transports don't need parsing.
    if (typeof data === 'string') data = JSON.parse(data);

    if (connection.debug) console.log('RECV', JSON.stringify(data));

    connection.messageBuffer.push({
      t: (new Date()).toTimeString(),
      recv:JSON.stringify(data)
    });
    while (connection.messageBuffer.length > 100) {
      connection.messageBuffer.shift();
    }

    try {
      connection.handleMessage(data);
    } catch (e) {
      connection.emit('error', e);
      // We could also restart the connection here, although that might result
      // in infinite reconnection bugs.
      throw e;
    }
  }

  socket.onopen = function() {
    connection._setState('connecting');
  };

  socket.onerror = function(e) {
    // This isn't the same as a regular error, because it will happen normally
    // from time to time. Your connection should probably automatically
    // reconnect anyway, but that should be triggered off onclose not onerror.
    // (onclose happens when onerror gets called anyway).
    connection.emit('connection error', e);
  };

  socket.onclose = function(reason) {
    connection._setState('disconnected', reason);
    if (reason === 'Closed' || reason === 'Stopped by server') {
      connection._setState('stopped', reason);
    }
  };
};


/**
 * @param {object} msg
 * @param {String} msg.a action
 */
Connection.prototype.handleMessage = function(msg) {
  // Switch on the message action. Most messages are for documents and are
  // handled in the doc class.
  switch (msg.a) {
    case 'init':
      // Client initialization packet. This bundle of joy contains our client
      // ID.
      if (msg.protocol !== 0) throw new Error('Invalid protocol version');
      if (typeof msg.id != 'string') throw new Error('Invalid client id');

      this.id = msg.id;
      this._setState('connected');
      break;

    case 'qfetch':
    case 'qsub':
    case 'q':
    case 'qunsub':
      // Query message. Pass this to the appropriate query object.
      var query = this.queries[msg.id];
      if (query) query._onMessage(msg);
      break;

    case 'bs':
      // Bulk subscribe response. The responses for each document are contained within.
      var result = msg.s;
      for (var cName in result) {
        for (var docName in result[cName]) {
          var doc = this.get(cName, docName);
          if (!doc) {
            if (console) console.error('Message for unknown doc. Ignoring.', msg);
            break;
          }

          var msg = result[cName][docName];
          if (typeof msg === 'object') {
            doc._handleSubscribe(msg.error, msg);
          } else {
            // The msg will be true if we simply resubscribed.
            doc._handleSubscribe(null, null);
          }
        }
      }
      break;

    default:
      // Document message. Pull out the referenced document and forward the
      // message.
      var collection, docName, doc;
      if (msg.d) {
        collection = this._lastReceivedCollection = msg.c;
        docName = this._lastReceivedDoc = msg.d;
      } else {
        collection = msg.c = this._lastReceivedCollection;
        docName = msg.d = this._lastReceivedDoc;
      }

      var doc = this.getExisting(collection, docName);
      if (doc) doc._onMessage(msg);
  }
};


Connection.prototype.reset = function() {
  this.id = this.lastError =
    this._lastReceivedCollection = this._lastReceivedDoc =
    this._lastSentCollection = this._lastSentDoc = null;

  this.seq = 1;
};


Connection.prototype._setupRetry = function() {
  if (!this.canSend) {
    clearInterval(this._retryInterval);
    this._retryInterval = null;
    return;
  }
  if (this._retryInterval != null) return;

  var connection = this;
  this._retryInterval = setInterval(function() {
    for (var collectionName in connection.collections) {
      var collection = connection.collections[collectionName];
      for (var docName in collection) {
        collection[docName].retry();
      }
    }
  }, 1000);
};


// Set the connection's state. The connection is basically a state machine.
Connection.prototype._setState = function(newState, data) {
  if (this.state === newState) return;

  // I made a state diagram. The only invalid transitions are getting to
  // 'connecting' from anywhere other than 'disconnected' and getting to
  // 'connected' from anywhere other than 'connecting'.
  if ((newState === 'connecting' && (this.state !== 'disconnected' && this.state !== 'stopped'))
      || (newState === 'connected' && this.state !== 'connecting')) {
    throw new Error("Cannot transition directly from " + this.state + " to " + newState);
  }

  this.state = newState;
  this.canSend = (newState === 'connecting' && this.socket.canSendWhileConnecting) || newState === 'connected';
  this._setupRetry();

  if (newState === 'disconnected') this.reset();

  this.emit(newState, data);

  var ignoreSubs = {};
  // No bulk subscribe for queries yet.
  for (var id in this.queries) {
    var query = this.queries[id];
    query._onConnectionStateChanged(newState, data);
    if (
      query.docMode === 'sub' &&
      (newState === 'connecting' || newState === 'connected')
    ) {
      var ignoreSubsCollection = ignoreSubs[query.collection] ||
        (ignoreSubs[query.collection] = {});
      for (var i = 0; i < query.results.length; i++) {
        ignoreSubsCollection[query.results[i].name] = true;
      }
    }
  }

  // & Emit the event to all documents & queries. It might make sense for
  // documents to just register for this stuff using events, but that couples
  // connections and documents a bit much. Its not a big deal either way.
  this.opQueue = [];
  this.bsStart();
  for (var c in this.collections) {
    var collection = this.collections[c];
    for (var docName in collection) {
      if (ignoreSubs[c] && ignoreSubs[c][docName]) continue;
      collection[docName]._onConnectionStateChanged(newState, data);
    }
  }

  // Its important that operations are resent in the same order that they were
  // originally sent. If we don't sort, an op with a high sequence number will
  // convince the server not to accept any ops with earlier sequence numbers.
  this.opQueue.sort(function(a, b) { return a.seq - b.seq; });
  for (var i = 0; i < this.opQueue.length; i++) {
    this.send(this.opQueue[i]);
  }

  this.opQueue = null;
  this.bsEnd();
};

// So, there's an awful error case where the client sends two requests (which
// fail), then reconnects. The documents could have _onConnectionStateChanged
// called in the wrong order and the operations then get sent with reversed
// sequence numbers. This causes the server to incorrectly reject the second
// sent op. So we need to queue the operations while we're reconnecting and
// resend them in the correct order.
Connection.prototype.sendOp = function(data) {
  if (this.opQueue) {
    this.opQueue.push(data);
  } else {
    this.send(data);
  }
};

Connection.prototype.bsStart = function() {
  this.subscribeData = {};
};

Connection.prototype.bsEnd = function() {
  // Only send bulk subscribe if not empty
  if (hasKeys(this.subscribeData)) {
    this.send({a:'bs', s:this.subscribeData});
  }
  this.subscribeData = null;
};

// This is called by the document class when the document wants to subscribe.
// We could just send a subscribe message, but during reconnect that causes a
// bajillion messages over browserchannel. During reconnect we'll aggregate,
// similar to sendOp.
Connection.prototype.sendSubscribe = function(collection, name, v) {
  if (this.subscribeData) {
    var data = this.subscribeData;
    if (!data[collection]) data[collection] = {};

    data[collection][name] = v || null;
  } else {
    var msg = {a:'sub', c:collection, d:name};
    if (v != null) msg.v = v;
    this.send(msg);
  }
};


/**
 * Sends a message down the socket
 */
Connection.prototype.send = function(msg) {
  if (this.debug) console.log("SEND", JSON.stringify(msg));
  this.messageBuffer.push({t:Date.now(), send:JSON.stringify(msg)});
  while (this.messageBuffer.length > 100) {
    this.messageBuffer.shift();
  }

  if (msg.d) { // The document the message refers to. Not set for queries.
    var collection = msg.c;
    var docName = msg.d;
    if (collection === this._lastSentCollection && docName === this._lastSentDoc) {
      delete msg.c;
      delete msg.d;
    } else {
      this._lastSentCollection = collection;
      this._lastSentDoc = docName;
    }
  }

  if (!this.socket.canSendJSON)
    msg = JSON.stringify(msg);

  this.socket.send(msg);
};


/**
 * Closes the socket and emits 'disconnected'
 */
Connection.prototype.disconnect = function() {
  this.socket.close();
};

Connection.prototype.getExisting = function(collection, name) {
  if (this.collections[collection]) return this.collections[collection][name];
};


/**
 * @deprecated
 */
Connection.prototype.getOrCreate = function(collection, name, data) {
  console.trace('getOrCreate is deprecated. Use get() instead');
  return this.get(collection, name, data);
};


/**
 * Get or create a document.
 *
 * @param collection
 * @param name
 * @param [data] ingested into document if created
 * @return {Doc}
 */
Connection.prototype.get = function(collection, name, data) {
  var collectionObject = this.collections[collection];
  if (!collectionObject)
    collectionObject = this.collections[collection] = {};

  var doc = collectionObject[name];
  if (!doc)
    doc = collectionObject[name] = new Doc(this, collection, name);

  // Even if the document isn't new, its possible the document was created
  // manually and then tried to be re-created with data (suppose a query
  // returns with data for the document). We should hydrate the document
  // immediately if we can because the query callback will expect the document
  // to have data.
  if (data && data.data !== undefined && !doc.state)
    doc.ingestData(data);

  return doc;
};


/**
 * Remove document from this.collections
 *
 * @private
 */
Connection.prototype._destroyDoc = function(doc) {
  var collectionObject = this.collections[doc.collection];
  if (!collectionObject) return;

  delete collectionObject[doc.name];

  // Delete the collection container if its empty. This could be a source of
  // memory leaks if you slowly make a billion collections, which you probably
  // won't do anyway, but whatever.
  if (!hasKeys(collectionObject))
    delete this.collections[doc.collection];
};


function hasKeys(object) {
  for (var key in object) return true;
  return false;
};


// Helper for createFetchQuery and createSubscribeQuery, below.
Connection.prototype._createQuery = function(type, collection, q, options, callback) {
  if (type !== 'fetch' && type !== 'sub')
    throw new Error('Invalid query type: ' + type);

  if (!options) options = {};
  var id = this.nextQueryId++;
  var query = new Query(type, this, id, collection, q, options, callback);
  this.queries[id] = query;
  query._execute();
  return query;
};

// Internal function. Use query.destroy() to remove queries.
Connection.prototype._destroyQuery = function(query) {
  delete this.queries[query.id];
};

// The query options object can contain the following fields:
//
// docMode: What to do with documents that are in the result set. Can be
//   null/undefined (default), 'fetch' or 'subscribe'. Fetch mode indicates
//   that the server should send document snapshots to the client for all query
//   results. These will be hydrated into the document objects before the query
//   result callbacks are returned. Subscribe mode gets document snapshots and
//   automatically subscribes the client to all results. Note that the
//   documents *WILL NOT* be automatically unsubscribed when the query is
//   destroyed. (ShareJS doesn't have enough information to do that safely).
//   Beware of memory leaks when using this option.
//
// poll: Forcably enable or disable polling mode. Polling mode will reissue the query
//   every time anything in the collection changes (!!) so, its quite
//   expensive.  It is automatically enabled for paginated and sorted queries.
//   By default queries run with polling mode disabled; which will only check
//   changed documents to test if they now match the specified query.
//   Set to false to disable polling mode, or true to enable it. If you don't
//   specify a poll option, polling mode is enabled or disabled automatically
//   by the query's backend.
//
// backend: Set the backend source for the query. You can attach different
//   query backends to livedb and pick which one the query should hit using
//   this parameter.
//
// results: (experimental) Initial list of resultant documents. This is
//   useful for rehydrating queries when you're using autoFetch / autoSubscribe
//   so the server doesn't have to send over snapshots for documents the client
//   already knows about. This is experimental - the API may change in upcoming
//   versions.

// Create a fetch query. Fetch queries are only issued once, returning the
// results directly into the callback.
//
// The index is specific to the source, but if you're using mongodb it'll be
// the collection to which the query is made.
// The callback should have the signature function(error, results, extraData)
// where results is a list of Doc objects.
Connection.prototype.createFetchQuery = function(index, q, options, callback) {
  return this._createQuery('fetch', index, q, options, callback);
};

// Create a subscribe query. Subscribe queries return with the initial data
// through the callback, then update themselves whenever the query result set
// changes via their own event emitter.
//
// If present, the callback should have the signature function(error, results, extraData)
// where results is a list of Doc objects.
Connection.prototype.createSubscribeQuery = function(index, q, options, callback) {
  return this._createQuery('sub', index, q, options, callback);
};

},{"./doc":2,"./emitter":3,"./query":5}],2:[function(require,module,exports){
var types = require('../types').ottypes;
var emitter = require('./emitter');

/**
 * A Doc is a client's view on a sharejs document.
 *
 * It is is uniquely identified by its `name` and `collection`.  Documents
 * should not be created directly. Create them with Connection.get()
 *
 *
 *
 * Subscriptions
 * -------------
 *
 * We can subscribe a document to stay in sync with the server.
 *   doc.subscribe(function(error) {
 *     doc.state // = 'ready'
 *     doc.subscribed // = true
 *   })
 * The server now sends us all changes concerning this document and these are
 * applied to our snapshot. If the subscription was successful the initial
 * snapshot and version sent by the server are loaded into the document.
 *
 * To stop listening to the changes we call `doc.unsubscribe()`.
 *
 * If we just want to load the data but not stay up-to-date, we call
 *   doc.fetch(function(error) {
 *     doc.snapshot // sent by server
 *   })
 *
 * TODO What happens when the document does not exist yet.
 *
 *
 *
 * Editing documents
 * ------------------
 *
 * To edit a document we have to create an editing context
 *   context = doc.context()
 * The context is an object exposing the type API of the documents OT type.
 *   doc.type = 'text'
 *   context.insert(0, 'In the beginning')
 *   doc.snapshot // 'In the beginning...'
 *
 * If a operation is applied on the snapshot the `_onOp` on the context is
 * called. The type implementation then usually triggers a corresponding event.
 *
 *
 *
 *
 * Events
 * ------
 *
 * You can use doc.on(eventName, callback) to subscribe to the following events:
 * - `before op (op, localContext)` Fired before an operation is applied to the
 *   snapshot. The document is already in locked state, so it is not allowed to
 *   submit further operations. It may be used to read the old snapshot just
 *   before applying an operation. The callback is passed the operation and the
 *   editing context if the operation originated locally and `false` otherwise
 * - `after op (op, localContext)` Fired after an operation has been applied to
 *   the snapshot. The arguments are the same as for `before op`
 * - `op (op, localContext)` The same as `after op` unless incremental updates
 *   are enabled. In this case it is fired after every partial operation with
 *   this operation as the first argument. When fired the document is in a
 *   locked state which only allows reading operations.
 * - `subscribed (error)` The document was subscribed
 * - `created (localContext)` The document was created. That means its type was
 *   set and it has some initial data.
 * - `del (localContext, snapshot)` Fired after the document is deleted, that is
 *   the snapshot is null. It is passed the snapshot before delteion as an
 *   arguments
 * - `error`
 *
 * TODO rename `op` to `after partial op`
 */
var Doc = exports.Doc = function(connection, collection, name) {
  emitter.EventEmitter.call(this);

  this.connection = connection;

  this.collection = collection;
  this.name = name;

  this.version = this.type = null;
  this.snapshot = undefined;

  // **** State in document:

  // The action the document tries to perform with the server
  //
  // - subscribe
  // - unsubscribe
  // - fetch
  // - submit: send an operation
  this.action = null;

  // The data the document object stores can be in one of the following three states:
  //   - No data. (null) We honestly don't know whats going on.
  //   - Floating ('floating'): we have a locally created document that hasn't
  //     been created on the server yet)
  //   - Live ('ready') (we have data thats current on the server at some version).
  this.state = null;

  // Our subscription status. Either we're subscribed on the server, or we aren't.
  this.subscribed = false;
  // Either we want to be subscribed (true), we want a new snapshot from the
  // server ('fetch'), or we don't care (false).  This is also used when we
  // disconnect & reconnect to decide what to do.
  this.wantSubscribe = false;
  // This list is used for subscribe and unsubscribe, since we'll only want to
  // do one thing at a time.
  this._subscribeCallbacks = [];


  // *** end state stuff.

  // This doesn't provide any standard API access right now.
  this.provides = {};

  // The editing contexts. These are usually instances of the type API when the
  // document is ready for edits.
  this.editingContexts = [];

  // The op that is currently roundtripping to the server, or null.
  //
  // When the connection reconnects, the inflight op is resubmitted.
  //
  // This has the same format as an entry in pendingData, which is:
  // {[create:{...}], [del:true], [op:...], callbacks:[...], src:, seq:}
  this.inflightData = null;

  // All ops that are waiting for the server to acknowledge @inflightData
  // This used to just be a single operation, but creates & deletes can't be composed with
  // regular operations.
  //
  // This is a list of {[create:{...}], [del:true], [op:...], callbacks:[...]}
  this.pendingData = [];

  // The OT type of this document.
  //
  // The document also responds to the api provided by the type
  this.type = null
};
emitter.mixin(Doc);

/**
 * Unsubscribe and remove all editing contexts
 */
Doc.prototype.destroy = function(callback) {
  var doc = this;
  this.unsubscribe(function() {
    // Don't care if there's an error unsubscribing.

    if (doc.hasPending()) {
      doc.once('nothing pending', function() {
        doc.connection._destroyDoc(doc);
      });
    } else {
      doc.connection._destroyDoc(doc);
    }
    doc.removeContexts();
    if (callback) callback();
  });
};


// ****** Manipulating the document snapshot, version and type.

// Set the document's type, and associated properties. Most of the logic in
// this function exists to update the document based on any added & removed API
// methods.
//
// @param newType OT type provided by the ottypes library or its name or uri
Doc.prototype._setType = function(newType) {
  if (typeof newType === 'string') {
    if (!types[newType]) throw new Error("Missing type " + newType + ' ' + this.collection + ' ' + this.name);
    newType = types[newType];
  }
  this.removeContexts();

  // Set the new type
  this.type = newType;

  // If we removed the type from the object, also remove its snapshot.
  if (!newType) {
    this.provides = {};
    this.snapshot = undefined;
  } else if (newType.api) {
    // Register the new type's API.
    this.provides = newType.api.provides;
  }
};

// Injest snapshot data. This data must include a version, snapshot and type.
// This is used both to ingest data that was exported with a webpage and data
// that was received from the server during a fetch.
//
// @param data.v    version
// @param data.data
// @param data.type
// @fires ready
Doc.prototype.ingestData = function(data) {
  if (typeof data.v !== 'number') {
    throw new Error('Missing version in ingested data ' + this.collection + ' ' + this.name);
  }
  if (this.state) {
    // Silently ignore if doc snapshot version is equal or newer
    // TODO: Investigate whether this should happen in practice or not
    if (this.version >= data.v) return;
    console.warn('Ignoring ingest data for', this.collection, this.name,
      '\n  in state:', this.state, '\n  version:', this.version,
      '\n  snapshot:\n', this.snapshot, '\n  incoming data:\n', data);
    return;
  }

  this.version = data.v;
  // data.data is what the server will actually send. data.snapshot is the old
  // field name - supported now for backwards compatibility.
  this.snapshot = data.data;
  this._setType(data.type);

  this.state = 'ready';
  this.emit('ready');
};

// Get and return the current document snapshot.
Doc.prototype.getSnapshot = function() {
  return this.snapshot;
};

// The callback will be called at a time when the document has a snapshot and
// you can start applying operations. This may be immediately.
Doc.prototype.whenReady = function(fn) {
  if (this.state === 'ready') {
    fn();
  } else {
    this.once('ready', fn);
  }
};

Doc.prototype.retry = function() {
  if (!this.inflightData) return;
  var threshold = 5000 * Math.pow(2, this.inflightData.retries);
  if (this.inflightData.sentAt < Date.now() - threshold) {
    this.connection.emit('retry', this);
    this._clearAction();
  }
};

Doc.prototype.hasPending = function() {
  return this.action != null || this.inflightData != null || !!this.pendingData.length;
};


// **** Helpers for network messages

// Send a message to the connection from this document.
Doc.prototype._send = function(message) {
  message.c = this.collection;
  message.d = this.name;
  this.connection.send(message);
};

// This function exists so connection can call it directly for bulk subscribes.
// It could just make a temporary object literal, thats pretty slow.
Doc.prototype._handleSubscribe = function(err, data) {
  if (err && err !== 'Already subscribed') {
    console.error('Could not subscribe:', err, this.collection, this.name);
    this.emit('error', err);
    // There's probably a reason we couldn't subscribe. Don't retry.
    this._setWantSubscribe(false, null, err);
    return;
  }
  if (data) this.ingestData(data);
  this.subscribed = true;
  this._clearAction();
  this.emit('subscribe');
  this._finishSub();
};

Doc.prototype._finishQuerySubscribe = function(version) {
  // This generally shouldn't happen, but in a race condition where we
  // missed a an op, just subscribe to the specific doc again
  if (version > this.version) return this.subscribe();

  // Fake out a doc subscription, since we are already up to date
  this.subscribed = true;
  this.wantSubscribe = true;
  this.emit('subscribe');
  this._finishSub();
};

// This is called by the connection when it receives a message for the document.
Doc.prototype._onMessage = function(msg) {
  if (!(msg.c === this.collection && msg.d === this.name)) {
    // This should never happen - its a sanity check for bugs in the connection code.
    throw new Error('Got message for wrong document. ' + this.collection + ' ' + this.name);
  }

  // msg.a = the action.
  switch (msg.a) {
    case 'fetch':
      // We're done fetching. This message has no other information.
      if (msg.data) this.ingestData(msg.data);
      if (this.wantSubscribe === 'fetch') this.wantSubscribe = false;
      this._clearAction();
      this._finishSub(msg.error);
      break;

    case 'sub':
      // Subscribe reply.
      this._handleSubscribe(msg.error, msg.data);
      break;

    case 'unsub':
      // Unsubscribe reply
      this.subscribed = false;
      this.emit('unsubscribe');

      this._clearAction();
      this._finishSub(msg.error);
      break;

    case 'ack':
      // Acknowledge a locally submitted operation.
      //
      // Usually we do nothing here - all the interesting logic happens when we
      // get sent our op back in the op stream (which happens even if we aren't
      // subscribed)
      if (msg.error && msg.error !== 'Op already submitted') {
        // The server has rejected an op from the client for an unexpected reason.
        // We'll send the error message to the user and try to roll back the change.
        if (this.inflightData) {
          console.warn('Operation was rejected (' + msg.error + '). Trying to rollback change locally.');
          this._tryRollback(this.inflightData);
          this._clearInflightOp(msg.error);
        } else {
          // I managed to get into this state once. I'm not sure how it happened.
          // The op was maybe double-acknowledged?
          console.warn('Second acknowledgement message (error) received', msg, this);
        }
      }
      break;

    case 'op':
      if (this.inflightData &&
          msg.src === this.inflightData.src &&
          msg.seq === this.inflightData.seq) {
        // This one is mine. Accept it as acknowledged.
        this._opAcknowledged(msg);
        break;
      }

      if (msg.v < this.version) {
        // This will happen naturally in the following (or similar) cases:
        //
        // Client is not subscribed to document.
        // -> client submits an operation (v=10)
        // -> client subscribes to a query which matches this document. Says we
        //    have v=10 of the doc.
        //
        // <- server acknowledges the operation (v=11). Server acknowledges the
        //    operation because the doc isn't subscribed
        // <- server processes the query, which says the client only has v=10.
        //    Server subscribes at v=10 not v=11, so we get another copy of the
        //    v=10 operation.
        //
        // In this case, we can safely ignore the old (duplicate) operation.
        break;
      }

      if (msg.v > this.version) {
        // If we get in here, it means we missed an operation from the server,
        // or operations are being sent to the client out of order. This
        // *should* never happen, but it currently does because of a bug in the
        // way the query code & doc class interact. If you have a document at
        // an old version (and not subscribed), when the document matches a
        // query the query will send the client a snapshot of the document
        // instead of the operations in between.
        console.warn("Client got future operation from the server",
            this.collection, this.name, msg);

        // Get the operations we missed and catch up
        this._getLatestOps();
        break;
      }

      if (this.inflightData) xf(this.inflightData, msg);

      for (var i = 0; i < this.pendingData.length; i++) {
        xf(this.pendingData[i], msg);
      }

      this.version++;
      this._otApply(msg, false);
      break;

    case 'meta':
      console.warn('Unhandled meta op:', msg);
      break;

    default:
      console.warn('Unhandled document message:', msg);
      break;
  }
};

Doc.prototype._getLatestOps = function() {
  this._send({a: 'fetch', v: this.version});
};

// Called whenever (you guessed it!) the connection state changes. This will
// happen when we get disconnected & reconnect.
Doc.prototype._onConnectionStateChanged = function(state, reason) {
  if (state === 'connecting' || state === 'connected') {
    // We go into the connected state once we have a sessionID. We can't send
    // new ops until then, so we need to flush again on connected
    this.flush();
  } else if (state === 'disconnected') {
    this._clearAction();
    this.subscribed = false;
  }
};


Doc.prototype._clearAction = function() {
  this.action = null;
  this.flush();

  if (!this.hasPending()) {
    this.emit('nothing pending');
  }
};

// Send the next pending op to the server, if we can.
//
// Only one operation can be in-flight at a time. If an operation is already on
// its way, or we're not currently connected, this method does nothing.
Doc.prototype.flush = function() {
  if (!this.connection.canSend || this.action) return;

  if (this.inflightData) {
    this._sendOpData();
    return;
  }

  var opData;
  // Pump and dump any no-ops from the front of the pending op list.
  while (this.pendingData.length && isNoOp(opData = this.pendingData[0])) {
    var callbacks = opData.callbacks;
    for (var i = 0; i < callbacks.length; i++) {
      callbacks[i](opData.error);
    }
    this.pendingData.shift();
  }

  // We consider sending operations before considering subscribing because its
  // convenient in access control code to not need to worry about subscribing
  // to documents that don't exist.
  if (!this.paused && this.pendingData.length && this.connection.state === 'connected') {
    // Try and send any pending ops. We can't send ops while in
    this.inflightData = this.pendingData.shift();
    // This also sets action to 'submit'.
    this._sendOpData();
  } else if (this.subscribed && !this.wantSubscribe) {
    this.action = 'unsubscribe';
    this._send({a:'unsub'});
  } else if (!this.subscribed && this.wantSubscribe === 'fetch') {
    this.action = 'fetch';
    this._send(this.state === 'ready' ? {a:'fetch', v:this.version} : {a:'fetch'});
  } else if (!this.subscribed && this.wantSubscribe) {
    this.action = 'subscribe';
    // Special send method needed for bulk subscribes on reconnect.
    this.connection.sendSubscribe(this.collection, this.name, this.state === 'ready' ? this.version : null);
  }
};


// ****** Subscribing, unsubscribing and fetching

// These functions iare copied into the query class as well, so be careful making
// changes here.

// Value is true, false or 'fetch'.
Doc.prototype._setWantSubscribe = function(value, callback, err) {
  if (this.subscribed === this.wantSubscribe &&
      (this.subscribed === value || value === 'fetch' && this.subscribed)) {
    if (callback) callback(err);
    return;
  }

  // If we want to subscribe, don't weaken it to a fetch.
  if (value !== 'fetch' || this.wantSubscribe !== true)
    this.wantSubscribe = value;

  if (callback) this._subscribeCallbacks.push(callback);
  this.flush();
};

// Open the document. There is no callback and no error handling if you're
// already connected.
//
// Only call this once per document.
Doc.prototype.subscribe = function(callback) {
  this._setWantSubscribe(true, callback);
};

// Unsubscribe. The data will stay around in local memory, but we'll stop
// receiving updates.
Doc.prototype.unsubscribe = function(callback) {
  this._setWantSubscribe(false, callback);
};

// Call to request fresh data from the server.
Doc.prototype.fetch = function(callback) {
  this._setWantSubscribe('fetch', callback);
};

// Called when our subscribe, fetch or unsubscribe messages are acknowledged.
Doc.prototype._finishSub = function(err) {
  if (!this._subscribeCallbacks.length) return;
  for (var i = 0; i < this._subscribeCallbacks.length; i++) {
    this._subscribeCallbacks[i](err);
  }
  this._subscribeCallbacks.length = 0;
};


// Operations


// ************ Dealing with operations.

// Helper function to set opData to contain a no-op.
var setNoOp = function(opData) {
  delete opData.op;
  delete opData.create;
  delete opData.del;
};

var isNoOp = function(opData) {
  return !opData.op && !opData.create && !opData.del;
}

// Try to compose data2 into data1. Returns truthy if it succeeds, otherwise falsy.
var tryCompose = function(type, data1, data2) {
  if (data1.create && data2.del) {
    setNoOp(data1);
  } else if (data1.create && data2.op) {
    // Compose the data into the create data.
    var data = (data1.create.data === undefined) ? type.create() : data1.create.data;
    data1.create.data = type.apply(data, data2.op);
  } else if (isNoOp(data1)) {
    data1.create = data2.create;
    data1.del = data2.del;
    data1.op = data2.op;
  } else if (data1.op && data2.op && type.compose) {
    data1.op = type.compose(data1.op, data2.op);
  } else {
    return false;
  }
  return true;
};

// Transform server op data by a client op, and vice versa. Ops are edited in place.
var xf = function(client, server) {
  // In this case, we're in for some fun. There are some local operations
  // which are totally invalid - either the client continued editing a
  // document that someone else deleted or a document was created both on the
  // client and on the server. In either case, the local document is way
  // invalid and the client's ops are useless.
  //
  // The client becomes a no-op, and we keep the server op entirely.
  if (server.create || server.del) return setNoOp(client);
  if (client.create) throw new Error('Invalid state. This is a bug. ' + this.collection + ' ' + this.name);

  // The client has deleted the document while the server edited it. Kill the
  // server's op.
  if (client.del) return setNoOp(server);

  // We only get here if either the server or client ops are no-op. Carry on,
  // nothing to see here.
  if (!server.op || !client.op) return;

  // They both edited the document. This is the normal case for this function -
  // as in, most of the time we'll end up down here.
  //
  // You should be wondering why I'm using client.type instead of this.type.
  // The reason is, if we get ops at an old version of the document, this.type
  // might be undefined or a totally different type. By pinning the type to the
  // op data, we make sure the right type has its transform function called.
  if (client.type.transformX) {
    var result = client.type.transformX(client.op, server.op);
    client.op = result[0];
    server.op = result[1];
  } else {
    var _c = client.type.transform(client.op, server.op, 'left');
    var _s = client.type.transform(server.op, client.op, 'right');
    client.op = _c; server.op = _s;
  }
};

/**
 * Applies the operation to the snapshot
 *
 * If the operation is create or delete it emits `create` or `del`.  Then the
 * operation is applied to the snapshot and `op` and `after op` are emitted.  If
 * the type supports incremental updates and `this.incremental` is true we fire
 * `op` after every small operation.
 *
 * This is the only function to fire the above mentioned events.
 *
 * @private
 */
Doc.prototype._otApply = function(opData, context) {
  this.locked = true;

  if (opData.create) {
    // If the type is currently set, it means we tried creating the document
    // and someone else won. client create x server create = server create.
    var create = opData.create;
    this._setType(create.type);
    this.snapshot = this.type.create(create.data);

    // This is a bit heavyweight, but I want the created event to fire outside of the lock.
    this.once('unlock', function() {
      this.emit('create', context);
    });
  } else if (opData.del) {
    // The type should always exist in this case. del x _ = del
    var oldSnapshot = this.snapshot;
    this._setType(null);
    this.once('unlock', function() {
      this.emit('del', context, oldSnapshot);
    });
  } else if (opData.op) {
    if (!this.type) throw new Error('Document does not exist. ' + this.collection + ' ' + this.name);

    var type = this.type;

    var op = opData.op;

    // The context needs to be told we're about to edit, just in case it needs
    // to store any extra data. (text-tp2 has this constraint.)
    for (var i = 0; i < this.editingContexts.length; i++) {
      var c = this.editingContexts[i];
      if (c != context && c._beforeOp) c._beforeOp(opData.op);
    }

    this.emit('before op', op, context);

    // This exists so clients can pull any necessary data out of the snapshot
    // before it gets changed.  Previously we kept the old snapshot object and
    // passed it to the op event handler. However, apply no longer guarantees
    // the old object is still valid.
    //
    // Because this could be totally unnecessary work, its behind a flag. set
    // doc.incremental to enable.
    if (this.incremental && type.incrementalApply) {
      var _this = this;
      type.incrementalApply(this.snapshot, op, function(o, snapshot) {
        _this.snapshot = snapshot;
        _this.emit('op', o, context);
      });
    } else {
      // This is the most common case, simply applying the operation to the local snapshot.
      this.snapshot = type.apply(this.snapshot, op);
      this.emit('op', op, context);
    }
  }
  // Its possible for none of the above cases to match, in which case the op is
  // a no-op. This will happen when a document has been deleted locally and
  // remote ops edit the document.


  this.locked = false;
  this.emit('unlock');

  if (opData.op) {
    var contexts = this.editingContexts;
    // Notify all the contexts about the op (well, all the contexts except
    // the one which initiated the submit in the first place).
    // NOTE Handle this with events?
    for (var i = 0; i < contexts.length; i++) {
      var c = contexts[i];
      if (c != context && c._onOp) c._onOp(opData.op);
    }
    for (var i = 0; i < contexts.length; i++) {
      if (contexts[i].shouldBeRemoved) contexts.splice(i--, 1);
    }

    return this.emit('after op', opData.op, context);
  }
};



// ***** Sending operations


// Actually send op data to the server.
Doc.prototype._sendOpData = function() {
  var d = this.inflightData;

  if (this.action) throw new Error('Invalid state ' + this.action + ' for sendOpData. ' + this.collection + ' ' + this.name);
  this.action = 'submit';
  d.sentAt = Date.now();
  d.retries = (d.retries == null) ? 0 : d.retries + 1;

  var msg = {a:'op', v:this.version};
  if (d.src) {
    msg.src = d.src;
    msg.seq = d.seq;
  }

  if (d.op) msg.op = d.op;
  if (d.create) msg.create = d.create;
  if (d.del) msg.del = d.del;

  msg.c = this.collection;
  msg.d = this.name;

  this.connection.sendOp(msg);

  // The first time we send an op, its id and sequence number is implicit.
  if (!d.src) {
    d.src = this.connection.id;
    d.seq = this.connection.seq++;
  }
};


// Queues the operation for submission to the server and applies it locally.
//
// Internal method called to do the actual work for submitOp(), create() and del().
// @private
//
// @param opData
// @param [opData.op]
// @param [opData.del]
// @param [opData.create]
// @param [context] the editing context
// @param [callback] called when operation is submitted
Doc.prototype._submitOpData = function(opData, context, callback) {
  if (typeof context === 'function') {
    callback = context;
    context = true; // The default context is true.
  }
  if (context == null) context = true;

  var error = function(err) {
    if (callback) return callback(err);
    console.warn('Failed attempt to submitOp:', err);
  };

  if (this.locked) {
    return error("Cannot call submitOp from inside an 'op' event handler. " + this.collection + ' ' + this.name);
  }

  // The opData contains either op, create, delete, or none of the above (a no-op).
  if (opData.op) {
    if (!this.type) return error('Document has not been created');
    // Try to normalize the op. This removes trailing skip:0's and things like that.
    if (this.type.normalize) opData.op = this.type.normalize(opData.op);
  }

  if (!this.state) {
    this.state = 'floating';
  }

  opData.type = this.type;
  opData.callbacks = [];

  // If the type supports composes, try to compose the operation onto the end
  // of the last pending operation.
  var operation;
  var previous = this.pendingData[this.pendingData.length - 1];

  if (previous && tryCompose(this.type, previous, opData)) {
    operation = previous;
  } else {
    operation = opData;
    this.pendingData.push(opData);
  }
  if (callback) operation.callbacks.push(callback);

  this._otApply(opData, context);

  // The call to flush is in a timeout so if submitOp() is called multiple
  // times in a closure all the ops are combined before being sent to the
  // server. It doesn't matter if flush is called a bunch of times.
  var _this = this;
  setTimeout((function() { _this.flush(); }), 0);
};


// *** Client OT entrypoints.

// Submit an operation to the document.
//
// @param operation handled by the OT type
// @param [context] editing context
// @param [callback] called after operation submitted
//
// @fires before op, op, after op
Doc.prototype.submitOp = function(op, context, callback) {
  this._submitOpData({op: op}, context, callback);
};

// Create the document, which in ShareJS semantics means to set its type. Every
// object implicitly exists in the database but has no data and no type. Create
// sets the type of the object and can optionally set some initial data on the
// object, depending on the type.
//
// @param type  OT type
// @param data  initial
// @param context  editing context
// @param callback  called when operation submitted
Doc.prototype.create = function(type, data, context, callback) {
  if (typeof data === 'function') {
    // Setting the context to be the callback function in this case so _submitOpData
    // can handle the default value thing.
    context = data;
    data = undefined;
  }

  var op = {create: {type:type, data:data}};
  if (this.type) {
    if (callback) callback('Document already exists', this._opErrorContext(op));
    return
  }

  this._submitOpData(op, context, callback);
};

// Delete the document. This creates and submits a delete operation to the
// server. Deleting resets the object's type to null and deletes its data. The
// document still exists, and still has the version it used to have before you
// deleted it (well, old version +1).
//
// @param context   editing context
// @param callback  called when operation submitted
Doc.prototype.del = function(context, callback) {
  if (!this.type) {
    if (callback) callback('Document does not exist');
    return;
  }

  this._submitOpData({del: true}, context, callback);
};


// Stops the document from sending any operations to the server.
Doc.prototype.pause = function() {
  this.paused = true;
};

// Continue sending operations to the server
Doc.prototype.resume = function() {
  this.paused = false;
  this.flush();
};


// *** Receiving operations


// This will be called when the server rejects our operations for some reason.
// There's not much we can do here if the OT type is noninvertable, but that
// shouldn't happen too much in real life because readonly documents should be
// flagged as such. (I should probably figure out a flag for that).
//
// This does NOT get called if our op fails to reach the server for some reason
// - we optimistically assume it'll make it there eventually.
Doc.prototype._tryRollback = function(opData) {
  // This is probably horribly broken.
  if (opData.create) {
    this._setType(null);

    // I don't think its possible to get here if we aren't in a floating state.
    if (this.state === 'floating')
      this.state = null;
    else
      console.warn('Rollback a create from state ' + this.state);

  } else if (opData.op && opData.type.invert) {
    opData.op = opData.type.invert(opData.op);

    // Transform the undo operation by any pending ops.
    for (var i = 0; i < this.pendingData.length; i++) {
      xf(this.pendingData[i], opData);
    }

    // ... and apply it locally, reverting the changes.
    //
    // This operation is applied to look like it comes from a remote context.
    // I'm still not 100% sure about this functionality, because its really a
    // local op. Basically, the problem is that if the client's op is rejected
    // by the server, the editor window should update to reflect the undo.
    this._otApply(opData, false);
  } else if (opData.op || opData.del) {
    // This is where an undo stack would come in handy.
    this._setType(null);
    this.version = null;
    this.state = null;
    this.subscribed = false;
    this.emit('error', "Op apply failed and the operation could not be reverted");

    // Trigger a fetch. In our invalid state, we can't really do anything.
    this.fetch();
    this.flush();
  }
};

Doc.prototype._opErrorContext = function(op) {
  return {
    collection: this.collection,
    name: this.name,
    opData: op || this.inflightData
  };
};

Doc.prototype._clearInflightOp = function(error) {
  var callbacks = this.inflightData.callbacks;
  var context = this._opErrorContext();
  // There's no nice way to pass this context back to the caller - I settled on
  // using simple strings for error messages, and now this is hurting me. I'll
  // fix this API in sharejs 0.8.
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i](error || this.inflightData.error, context);
  }

  this.inflightData = null;
  this._clearAction();
};

// This is called when the server acknowledges an operation from the client.
Doc.prototype._opAcknowledged = function(msg) {
  // Our inflight op has been acknowledged, so we can throw away the inflight data.
  // (We were only holding on to it incase we needed to resend the op.)
  if (!this.state) {
    throw new Error('opAcknowledged called from a null state. This should never happen. ' + this.collection + ' ' + this.name);
  } else if (this.state === 'floating') {
    if (!this.inflightData.create) throw new Error('Cannot acknowledge an op. ' + this.collection + ' ' + this.name);

    // Our create has been acknowledged. This is the same as ingesting some data.
    this.version = msg.v;
    this.state = 'ready';
    var _this = this;
    setTimeout(function() { _this.emit('ready'); }, 0);
  } else {
    // We already have a snapshot. The snapshot should be at the acknowledged
    // version, because the server has sent us all the ops that have happened
    // before acknowledging our op.

    // This should never happen - something is out of order.
    if (msg.v !== this.version) {
      throw new Error('Invalid version from server. This can happen when you submit ops in a submitOp callback. Expected: ' + this.version + ' Message version: ' + msg.v + ' ' + this.collection + ' ' + this.name);
    }
  }

  // The op was committed successfully. Increment the version number
  this.version++;

  this._clearInflightOp();
};


// Creates an editing context
//
// The context is an object responding to getSnapshot(), submitOp() and
// destroy(). It also has all the methods from the OT type mixed in.
// If the document is destroyed, the detach() method is called on the context.
Doc.prototype.createContext = function() {
  var type = this.type;
  if (!type) throw new Error('Missing type ' + this.collection + ' ' + this.name);

  // I could use the prototype chain to do this instead, but Object.create
  // isn't defined on old browsers. This will be fine.
  var doc = this;
  var context = {
    getSnapshot: function() {
      return doc.snapshot;
    },
    submitOp: function(op, callback) {
      doc.submitOp(op, context, callback);
    },
    destroy: function() {
      if (this.detach) {
        this.detach();
        // Don't double-detach.
        delete this.detach;
      }
      // It will be removed from the actual editingContexts list next time
      // we receive an op on the document (and the list is iterated through).
      //
      // This is potentially dodgy, allowing a memory leak if you create &
      // destroy a whole bunch of contexts without receiving or sending any ops
      // to the document.
      //
      // NOTE Why can't we destroy contexts immediately?
      delete this._onOp;
      this.shouldBeRemoved = true;
    },

    // This is dangerous, but really really useful for debugging. I hope people
    // don't depend on it.
    _doc: this,
  };

  if (type.api) {
    // Copy everything else from the type's API into the editing context.
    for (var k in type.api) {
      context[k] = type.api[k];
    }
  } else {
    context.provides = {};
  }

  this.editingContexts.push(context);

  return context;
};


/**
 * Destroy all editing contexts
 */
Doc.prototype.removeContexts = function() {
  for (var i = 0; i < this.editingContexts.length; i++) {
    this.editingContexts[i].destroy();
  }
  this.editingContexts.length = 0;
};

},{"../types":7,"./emitter":3}],3:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter;

exports.EventEmitter = EventEmitter;
exports.mixin = mixin;

function mixin(Constructor) {
  for (var key in EventEmitter.prototype) {
    Constructor.prototype[key] = EventEmitter.prototype[key];
  }
}

},{"events":10}],4:[function(require,module,exports){
// Entry point for the client
//
// Usage:
//
//    <script src="dist/share.js"></script>

exports.Connection = require('./connection').Connection;
exports.Doc = require('./doc').Doc;
require('./textarea');

var types = require('../types');
exports.ottypes = types.ottypes;
exports.registerType = types.registerType;

},{"../types":7,"./connection":1,"./doc":2,"./textarea":6}],5:[function(require,module,exports){
var emitter = require('./emitter');

// Queries are live requests to the database for particular sets of fields.
//
// The server actively tells the client when there's new data that matches
// a set of conditions.
var Query = exports.Query = function(type, connection, id, collection, query, options, callback) {
  emitter.EventEmitter.call(this);

  // 'fetch' or 'sub'
  this.type = type;

  this.connection = connection;
  this.id = id;
  this.collection = collection;

  // The query itself. For mongo, this should look something like {"data.x":5}
  this.query = query;

  // Resultant document action for the server. Fetch mode will automatically
  // fetch all results. Subscribe mode will automatically subscribe all
  // results. Results are never unsubscribed.
  this.docMode = options.docMode; // undefined, 'fetch' or 'sub'.
  if (this.docMode === 'subscribe') this.docMode = 'sub';

  // Do we repoll the entire query whenever anything changes? (As opposed to
  // just polling the changed item). This needs to be enabled to be able to use
  // ordered queries (sortby:) and paginated queries. Set to undefined, it will
  // be enabled / disabled automatically based on the query's properties.
  this.poll = options.poll;

  // The backend we actually hit. If this isn't defined, it hits the snapshot
  // database. Otherwise this can be used to hit another configured query
  // index.
  this.backend = options.backend || options.source;

  // A list of resulting documents. These are actual documents, complete with
  // data and all the rest. If fetch is false, these documents will not
  // have any data. You should manually call fetch() or subscribe() on them.
  //
  // Calling subscribe() might be a good idea anyway, as you won't be
  // subscribed to the documents by default.
  this.knownDocs = options.knownDocs || [];
  this.results = [];

  // Do we have some initial data?
  this.ready = false;

  this.callback = callback;
};
emitter.mixin(Query);

Query.prototype.action = 'qsub';

// Helper for subscribe & fetch, since they share the same message format.
//
// This function actually issues the query.
Query.prototype._execute = function() {
  if (!this.connection.canSend) return;

  if (this.docMode) {
    var collectionVersions = {};
    // Collect the version of all the documents in the current result set so we
    // don't need to be sent their snapshots again.
    for (var i = 0; i < this.knownDocs.length; i++) {
      var doc = this.knownDocs[i];
      var c = collectionVersions[doc.collection] =
        (collectionVersions[doc.collection] || {});
      c[doc.name] = doc.version;
    }
  }

  var msg = {
    a: 'q' + this.type,
    id: this.id,
    c: this.collection,
    o: {},
    q: this.query,
  };

  if (this.docMode) {
    msg.o.m = this.docMode;
    // This should be omitted if empty, but whatever.
    msg.o.vs = collectionVersions;
  }
  if (this.backend != null) msg.o.b = this.backend;
  if (this.poll !== undefined) msg.o.p = this.poll;

  this.connection.send(msg);
};

// Make a list of documents from the list of server-returned data objects
Query.prototype._dataToDocs = function(data) {
  var results = [];
  var lastType;
  for (var i = 0; i < data.length; i++) {
    var docData = data[i];

    // Types are only put in for the first result in the set and every time the type changes in the list.
    if (docData.type) {
      lastType = docData.type;
    } else {
      docData.type = lastType;
    }

    var doc = this.connection.get(docData.c || this.collection, docData.d, docData);
    if (this.docMode === 'sub') {
      doc._finishQuerySubscribe(docData.v);
    }
    results.push(doc);
  }
  return results;
};

// Destroy the query object. Any subsequent messages for the query will be
// ignored by the connection. You should unsubscribe from the query before
// destroying it.
Query.prototype.destroy = function() {
  if (this.connection.canSend && this.type === 'sub') {
    this.connection.send({a:'qunsub', id:this.id});
  }

  this.connection._destroyQuery(this);
};

Query.prototype._onConnectionStateChanged = function(state, reason) {
  if (this.connection.state === 'connecting') {
    this._execute();
  }
};

// Internal method called from connection to pass server messages to the query.
Query.prototype._onMessage = function(msg) {
  if ((msg.a === 'qfetch') !== (this.type === 'fetch')) {
    if (console) console.warn('Invalid message sent to query', msg, this);
    return;
  }

  if (msg.error) this.emit('error', msg.error);

  switch (msg.a) {
    case 'qfetch':
      var results = msg.data ? this._dataToDocs(msg.data) : undefined;
      if (this.callback) this.callback(msg.error, results, msg.extra);
      // Once a fetch query gets its data, it is destroyed.
      this.connection._destroyQuery(this);
      break;

    case 'q':
      // Query diff data (inserts and removes)
      if (msg.diff) {
        // We need to go through the list twice. First, we'll ingest all the
        // new documents and set them as subscribed.  After that we'll emit
        // events and actually update our list. This avoids race conditions
        // around setting documents to be subscribed & unsubscribing documents
        // in event callbacks.
        for (var i = 0; i < msg.diff.length; i++) {
          var d = msg.diff[i];
          if (d.type === 'insert') d.values = this._dataToDocs(d.values);
        }

        for (var i = 0; i < msg.diff.length; i++) {
          var d = msg.diff[i];
          switch (d.type) {
            case 'insert':
              var newDocs = d.values;
              Array.prototype.splice.apply(this.results, [d.index, 0].concat(newDocs));
              this.emit('insert', newDocs, d.index);
              break;
            case 'remove':
              var howMany = d.howMany || 1;
              var removed = this.results.splice(d.index, howMany);
              this.emit('remove', removed, d.index);
              break;
            case 'move':
              var howMany = d.howMany || 1;
              var docs = this.results.splice(d.from, howMany);
              Array.prototype.splice.apply(this.results, [d.to, 0].concat(docs));
              this.emit('move', docs, d.from, d.to);
              break;
          }
        }
      }

      if (msg.extra !== void 0) {
        this.emit('extra', msg.extra);
      }
      break;
    case 'qsub':
      // This message replaces the entire result set with the set passed.
      if (!msg.error) {
        var previous = this.results;

        // Then add everything in the new result set.
        this.results = this.knownDocs = this._dataToDocs(msg.data);
        this.extra = msg.extra;

        this.ready = true;
        this.emit('change', this.results, previous);
      }
      if (this.callback) {
        this.callback(msg.error, this.results, this.extra);
        delete this.callback;
      }
      break;
  }
};

// Change the thing we're searching for. This isn't fully supported on the
// backend (it destroys the old query and makes a new one) - but its
// programatically useful and I might add backend support at some point.
Query.prototype.setQuery = function(q) {
  if (this.type !== 'sub') throw new Error('cannot change a fetch query');

  this.query = q;
  if (this.connection.canSend) {
    // There's no 'change' message to send to the server. Just resubscribe.
    this.connection.send({a:'qunsub', id:this.id});
    this._execute();
  }
};

},{"./emitter":3}],6:[function(require,module,exports){
/* This contains the textarea binding for ShareJS. This binding is really
 * simple, and a bit slow on big documents (Its O(N). However, it requires no
 * changes to the DOM and no heavy libraries like ace. It works for any kind of
 * text input field.
 *
 * You probably want to use this binding for small fields on forms and such.
 * For code editors or rich text editors or whatever, I recommend something
 * heavier.
 */

 var Doc = require('./doc').Doc;

/* applyChange creates the edits to convert oldval -> newval.
 *
 * This function should be called every time the text element is changed.
 * Because changes are always localised, the diffing is quite easy. We simply
 * scan in from the start and scan in from the end to isolate the edited range,
 * then delete everything that was removed & add everything that was added.
 * This wouldn't work for complex changes, but this function should be called
 * on keystroke - so the edits will mostly just be single character changes.
 * Sometimes they'll paste text over other text, but even then the diff
 * generated by this algorithm is correct.
 *
 * This algorithm is O(N). I suspect you could speed it up somehow using regular expressions.
 */
var applyChange = function(ctx, oldval, newval) {
  // Strings are immutable and have reference equality. I think this test is O(1), so its worth doing.
  if (oldval === newval) return;

  var commonStart = 0;
  while (oldval.charAt(commonStart) === newval.charAt(commonStart)) {
    commonStart++;
  }

  var commonEnd = 0;
  while (oldval.charAt(oldval.length - 1 - commonEnd) === newval.charAt(newval.length - 1 - commonEnd) &&
      commonEnd + commonStart < oldval.length && commonEnd + commonStart < newval.length) {
    commonEnd++;
  }

  if (oldval.length !== commonStart + commonEnd) {
    ctx.remove(commonStart, oldval.length - commonStart - commonEnd);
  }
  if (newval.length !== commonStart + commonEnd) {
    ctx.insert(commonStart, newval.slice(commonStart, newval.length - commonEnd));
  }
};

// Attach a textarea to a document's editing context.
//
// The context is optional, and will be created from the document if its not
// specified.
Doc.prototype.attachTextarea = function(elem, ctx) {
  if (!ctx) ctx = this.createContext();

  if (!ctx.provides.text) throw new Error('Cannot attach to non-text document');

  elem.value = ctx.get();

  // The current value of the element's text is stored so we can quickly check
  // if its been changed in the event handlers. This is mostly for browsers on
  // windows, where the content contains \r\n newlines. applyChange() is only
  // called after the \r\n newlines are converted, and that check is quite
  // slow. So we also cache the string before conversion so we can do a quick
  // check incase the conversion isn't needed.
  var prevvalue;

  // Replace the content of the text area with newText, and transform the
  // current cursor by the specified function.
  var replaceText = function(newText, transformCursor) {
    if (transformCursor) {
      var newSelection = [transformCursor(elem.selectionStart), transformCursor(elem.selectionEnd)];
    }

    // Fixate the window's scroll while we set the element's value. Otherwise
    // the browser scrolls to the element.
    var scrollTop = elem.scrollTop;
    elem.value = newText;
    prevvalue = elem.value; // Not done on one line so the browser can do newline conversion.
    if (elem.scrollTop !== scrollTop) elem.scrollTop = scrollTop;

    // Setting the selection moves the cursor. We'll just have to let your
    // cursor drift if the element isn't active, though usually users don't
    // care.
    if (newSelection && window.document.activeElement === elem) {
      elem.selectionStart = newSelection[0];
      elem.selectionEnd = newSelection[1];
    }
  };

  replaceText(ctx.get());


  // *** remote -> local changes

  ctx.onInsert = function(pos, text) {
    var transformCursor = function(cursor) {
      return pos < cursor ? cursor + text.length : cursor;
    };

    // Remove any window-style newline characters. Windows inserts these, and
    // they mess up the generated diff.
    var prev = elem.value.replace(/\r\n/g, '\n');
    replaceText(prev.slice(0, pos) + text + prev.slice(pos), transformCursor);
  };

  ctx.onRemove = function(pos, length) {
    var transformCursor = function(cursor) {
      // If the cursor is inside the deleted region, we only want to move back to the start
      // of the region. Hence the Math.min.
      return pos < cursor ? cursor - Math.min(length, cursor - pos) : cursor;
    };

    var prev = elem.value.replace(/\r\n/g, '\n');
    replaceText(prev.slice(0, pos) + prev.slice(pos + length), transformCursor);
  };


  // *** local -> remote changes

  // This function generates operations from the changed content in the textarea.
  var genOp = function(event) {
    // In a timeout so the browser has time to propogate the event's changes to the DOM.
    setTimeout(function() {
      if (elem.value !== prevvalue) {
        prevvalue = elem.value;
        applyChange(ctx, ctx.get(), elem.value.replace(/\r\n/g, '\n'));
      }
    }, 0);
  };

  var eventNames = ['textInput', 'keydown', 'keyup', 'select', 'cut', 'paste'];
  for (var i = 0; i < eventNames.length; i++) {
    var e = eventNames[i];
    if (elem.addEventListener) {
      elem.addEventListener(e, genOp, false);
    } else {
      elem.attachEvent('on' + e, genOp);
    }
  }

  ctx.detach = function() {
    for (var i = 0; i < eventNames.length; i++) {
      var e = eventNames[i];
      if (elem.removeEventListener) {
        elem.removeEventListener(e, genOp, false);
      } else {
        elem.detachEvent('on' + e, genOp);
      }
    }
  };

  return ctx;
};

},{"./doc":2}],7:[function(require,module,exports){

exports.ottypes = {};
exports.registerType = function(type) {
  if (type.name) exports.ottypes[type.name] = type;
  if (type.uri) exports.ottypes[type.uri] = type;
};

exports.registerType(require('ot-json0').type);
exports.registerType(require('ot-text').type);
exports.registerType(require('ot-text-tp2').type);

// The types register themselves on their respective types.
require('./text-api');
require('./text-tp2-api');

// The JSON API is buggy!! Please submit a pull request fixing it if you want to use it.
//require('./json-api');

},{"./text-api":8,"./text-tp2-api":9,"ot-json0":12,"ot-text":18,"ot-text-tp2":15}],8:[function(require,module,exports){
// Text document API for the 'text' type.

// The API implements the standard text API methods. In particular:
//
// - getLength() returns the length of the document in characters
// - getText() returns a string of the document
// - insert(pos, text, [callback]) inserts text at position pos in the document
// - remove(pos, length, [callback]) removes length characters at position pos
//
// Events are implemented by just adding the appropriate methods to your
// context object.
// onInsert(pos, text): Called when text is inserted.
// onRemove(pos, length): Called when text is removed.

var type = require('ot-text').type;

type.api = {
  provides: {text: true},

  // Returns the number of characters in the string
  getLength: function() { return this.getSnapshot().length; },


  // Returns the text content of the document
  get: function() { return this.getSnapshot(); },

  getText: function() {
    console.warn("`getText()` is deprecated; use `get()` instead.");
    return this.get();
  },

  // Insert the specified text at the given position in the document
  insert: function(pos, text, callback) {
    return this.submitOp([pos, text], callback);
  },

  remove: function(pos, length, callback) {
    return this.submitOp([pos, {d:length}], callback);
  },

  // When you use this API, you should implement these two methods
  // in your editing context.
  //onInsert: function(pos, text) {},
  //onRemove: function(pos, removedLength) {},

  _onOp: function(op) {
    var pos = 0;
    var spos = 0;
    for (var i = 0; i < op.length; i++) {
      var component = op[i];
      switch (typeof component) {
        case 'number':
          pos += component;
          spos += component;
          break;
        case 'string':
          if (this.onInsert) this.onInsert(pos, component);
          pos += component.length;
          break;
        case 'object':
          if (this.onRemove) this.onRemove(pos, component.d);
          spos += component.d;
      }
    }
  }
};

},{"ot-text":18}],9:[function(require,module,exports){
// Text document API for text-tp2

var type = require('ot-text-tp2').type;
var takeDoc = type._takeDoc;
var append = type._append;

var appendSkipChars = function(op, doc, pos, maxlength) {
  while ((maxlength == null || maxlength > 0) && pos.index < doc.data.length) {
    var part = takeDoc(doc, pos, maxlength, true);
    if (maxlength != null && typeof part === 'string') {
      maxlength -= part.length;
    }
    append(op, part.length || part);
  }
};

type.api = {
  provides: {text: true},

  // Number of characters in the string
  getLength: function() { return this.getSnapshot().charLength; },

  // Flatten the document into a string
  get: function() {
    var snapshot = this.getSnapshot();
    var strings = [];

    for (var i = 0; i < snapshot.data.length; i++) {
      var elem = snapshot.data[i];
      if (typeof elem == 'string') {
        strings.push(elem);
      }
    }

    return strings.join('');
  },

  getText: function() {
    console.warn("`getText()` is deprecated; use `get()` instead.");
    return this.get();
  },

  // Insert text at pos
  insert: function(pos, text, callback) {
    if (pos == null) pos = 0;

    var op = [];
    var docPos = {index: 0, offset: 0};
    var snapshot = this.getSnapshot();

    // Skip to the specified position
    appendSkipChars(op, snapshot, docPos, pos);

    // Append the text
    append(op, {i: text});
    appendSkipChars(op, snapshot, docPos);
    this.submitOp(op, callback);
    return op;
  },

  // Remove length of text at pos
  remove: function(pos, len, callback) {
    var op = [];
    var docPos = {index: 0, offset: 0};
    var snapshot = this.getSnapshot();

    // Skip to the position
    appendSkipChars(op, snapshot, docPos, pos);

    while (len > 0) {
      var part = takeDoc(snapshot, docPos, len, true);

      // We only need to delete actual characters. This should also be valid if
      // we deleted all the tombstones in the document here.
      if (typeof part === 'string') {
        append(op, {d: part.length});
        len -= part.length;
      } else {
        append(op, part);
      }
    }

    appendSkipChars(op, snapshot, docPos);
    this.submitOp(op, callback);
    return op;
  },

  _beforeOp: function() {
    // Its a shame we need this. This also currently relies on snapshots being
    // cloned during apply(). This is used in _onOp below to figure out what
    // text was _actually_ inserted and removed.
    //
    // Maybe instead we should do all the _onOp logic here and store the result
    // then play the events when _onOp is actually called or something.
    this.__prevSnapshot = this.getSnapshot();
  },

  _onOp: function(op) {
    var textPos = 0;
    var docPos = {index:0, offset:0};
    // The snapshot we get here is the document state _AFTER_ the specified op
    // has been applied. That means any deleted characters are now tombstones.
    var prevSnapshot = this.__prevSnapshot;

    for (var i = 0; i < op.length; i++) {
      var component = op[i];
      var part, remainder;

      if (typeof component == 'number') {
        // Skip
        for (remainder = component;
            remainder > 0;
            remainder -= part.length || part) {

          part = takeDoc(prevSnapshot, docPos, remainder);
          if (typeof part === 'string')
            textPos += part.length;
        }
      } else if (component.i != null) {
        // Insert
        if (typeof component.i == 'string') {
          // ... and its an insert of text, not insert of tombstones
          if (this.onInsert) this.onInsert(textPos, component.i);
          textPos += component.i.length;
        }
      } else {
        // Delete
        for (remainder = component.d;
            remainder > 0;
            remainder -= part.length || part) {

          part = takeDoc(prevSnapshot, docPos, remainder);
          if (typeof part == 'string' && this.onRemove)
            this.onRemove(textPos, part.length);
        }
      }
    }
  }
};

},{"ot-text-tp2":15}],10:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],11:[function(require,module,exports){
// These methods let you build a transform function from a transformComponent
// function for OT types like JSON0 in which operations are lists of components
// and transforming them requires N^2 work. I find it kind of nasty that I need
// this, but I'm not really sure what a better solution is. Maybe I should do
// this automatically to types that don't have a compose function defined.

// Add transform and transformX functions for an OT type which has
// transformComponent defined.  transformComponent(destination array,
// component, other component, side)
module.exports = bootstrapTransform
function bootstrapTransform(type, transformComponent, checkValidOp, append) {
  var transformComponentX = function(left, right, destLeft, destRight) {
    transformComponent(destLeft, left, right, 'left');
    transformComponent(destRight, right, left, 'right');
  };

  var transformX = type.transformX = function(leftOp, rightOp) {
    checkValidOp(leftOp);
    checkValidOp(rightOp);
    var newRightOp = [];

    for (var i = 0; i < rightOp.length; i++) {
      var rightComponent = rightOp[i];

      // Generate newLeftOp by composing leftOp by rightComponent
      var newLeftOp = [];
      var k = 0;
      while (k < leftOp.length) {
        var nextC = [];
        transformComponentX(leftOp[k], rightComponent, newLeftOp, nextC);
        k++;

        if (nextC.length === 1) {
          rightComponent = nextC[0];
        } else if (nextC.length === 0) {
          for (var j = k; j < leftOp.length; j++) {
            append(newLeftOp, leftOp[j]);
          }
          rightComponent = null;
          break;
        } else {
          // Recurse.
          var pair = transformX(leftOp.slice(k), nextC);
          for (var l = 0; l < pair[0].length; l++) {
            append(newLeftOp, pair[0][l]);
          }
          for (var r = 0; r < pair[1].length; r++) {
            append(newRightOp, pair[1][r]);
          }
          rightComponent = null;
          break;
        }
      }

      if (rightComponent != null) {
        append(newRightOp, rightComponent);
      }
      leftOp = newLeftOp;
    }
    return [leftOp, newRightOp];
  };

  // Transforms op with specified type ('left' or 'right') by otherOp.
  type.transform = function(op, otherOp, type) {
    if (!(type === 'left' || type === 'right'))
      throw new Error("type must be 'left' or 'right'");

    if (otherOp.length === 0) return op;

    if (op.length === 1 && otherOp.length === 1)
      return transformComponent([], op[0], otherOp[0], type);

    if (type === 'left')
      return transformX(op, otherOp)[0];
    else
      return transformX(otherOp, op)[1];
  };
};

},{}],12:[function(require,module,exports){
// Only the JSON type is exported, because the text type is deprecated
// otherwise. (If you want to use it somewhere, you're welcome to pull it out
// into a separate module that json0 can depend on).

module.exports = {
  type: require('./json0')
};

},{"./json0":13}],13:[function(require,module,exports){
/*
 This is the implementation of the JSON OT type.

 Spec is here: https://github.com/josephg/ShareJS/wiki/JSON-Operations

 Note: This is being made obsolete. It will soon be replaced by the JSON2 type.
*/

/**
 * UTILITY FUNCTIONS
 */

/**
 * Checks if the passed object is an Array instance. Can't use Array.isArray
 * yet because its not supported on IE8.
 *
 * @param obj
 * @returns {boolean}
 */
var isArray = function(obj) {
  return Object.prototype.toString.call(obj) == '[object Array]';
};

/**
 * Checks if the passed object is an Object instance.
 * No function call (fast) version
 *
 * @param obj
 * @returns {boolean}
 */
var isObject = function(obj) {
  return (!!obj) && (obj.constructor === Object);
};

/**
 * Clones the passed object using JSON serialization (which is slow).
 *
 * hax, copied from test/types/json. Apparently this is still the fastest way
 * to deep clone an object, assuming we have browser support for JSON.  @see
 * http://jsperf.com/cloning-an-object/12
 */
var clone = function(o) {
  return JSON.parse(JSON.stringify(o));
};

/**
 * JSON OT Type
 * @type {*}
 */
var json = {
  name: 'json0',
  uri: 'http://sharejs.org/types/JSONv0'
};

// You can register another OT type as a subtype in a JSON document using
// the following function. This allows another type to handle certain
// operations instead of the builtin JSON type.
var subtypes = {};
json.registerSubtype = function(subtype) {
  subtypes[subtype.name] = subtype;
};

json.create = function(data) {
  // Null instead of undefined if you don't pass an argument.
  return data === undefined ? null : clone(data);
};

json.invertComponent = function(c) {
  var c_ = {p: c.p};

  // handle subtype ops
  if (c.t && subtypes[c.t]) {
    c_.t = c.t;
    c_.o = subtypes[c.t].invert(c.o);
  }

  if (c.si !== void 0) c_.sd = c.si;
  if (c.sd !== void 0) c_.si = c.sd;
  if (c.oi !== void 0) c_.od = c.oi;
  if (c.od !== void 0) c_.oi = c.od;
  if (c.li !== void 0) c_.ld = c.li;
  if (c.ld !== void 0) c_.li = c.ld;
  if (c.na !== void 0) c_.na = -c.na;

  if (c.lm !== void 0) {
    c_.lm = c.p[c.p.length-1];
    c_.p = c.p.slice(0,c.p.length-1).concat([c.lm]);
  }

  return c_;
};

json.invert = function(op) {
  var op_ = op.slice().reverse();
  var iop = [];
  for (var i = 0; i < op_.length; i++) {
    iop.push(json.invertComponent(op_[i]));
  }
  return iop;
};

json.checkValidOp = function(op) {
  for (var i = 0; i < op.length; i++) {
    if (!isArray(op[i].p)) throw new Error('Missing path');
  }
};

json.checkList = function(elem) {
  if (!isArray(elem))
    throw new Error('Referenced element not a list');
};

json.checkObj = function(elem) {
  if (!isObject(elem)) {
    throw new Error("Referenced element not an object (it was " + JSON.stringify(elem) + ")");
  }
};

// helper functions to convert old string ops to and from subtype ops
function convertFromText(c) {
  c.t = 'text0';
  var o = {p: c.p.pop()};
  if (c.si != null) o.i = c.si;
  if (c.sd != null) o.d = c.sd;
  c.o = [o];
}

function convertToText(c) {
  c.p.push(c.o[0].p);
  if (c.o[0].i != null) c.si = c.o[0].i;
  if (c.o[0].d != null) c.sd = c.o[0].d;
  delete c.t;
  delete c.o;
}

json.apply = function(snapshot, op) {
  json.checkValidOp(op);

  op = clone(op);

  var container = {
    data: snapshot
  };

  for (var i = 0; i < op.length; i++) {
    var c = op[i];

    // convert old string ops to use subtype for backwards compatibility
    if (c.si != null || c.sd != null)
      convertFromText(c);

    var parent = null;
    var parentKey = null;
    var elem = container;
    var key = 'data';

    for (var j = 0; j < c.p.length; j++) {
      var p = c.p[j];

      parent = elem;
      parentKey = key;
      elem = elem[key];
      key = p;

      if (parent == null)
        throw new Error('Path invalid');
    }

    // handle subtype ops
    if (c.t && c.o !== void 0 && subtypes[c.t]) {
      elem[key] = subtypes[c.t].apply(elem[key], c.o);

    // Number add
    } else if (c.na !== void 0) {
      if (typeof elem[key] != 'number')
        throw new Error('Referenced element not a number');

      elem[key] += c.na;
    }

    // List replace
    else if (c.li !== void 0 && c.ld !== void 0) {
      json.checkList(elem);
      // Should check the list element matches c.ld
      elem[key] = c.li;
    }

    // List insert
    else if (c.li !== void 0) {
      json.checkList(elem);
      elem.splice(key,0, c.li);
    }

    // List delete
    else if (c.ld !== void 0) {
      json.checkList(elem);
      // Should check the list element matches c.ld here too.
      elem.splice(key,1);
    }

    // List move
    else if (c.lm !== void 0) {
      json.checkList(elem);
      if (c.lm != key) {
        var e = elem[key];
        // Remove it...
        elem.splice(key,1);
        // And insert it back.
        elem.splice(c.lm,0,e);
      }
    }

    // Object insert / replace
    else if (c.oi !== void 0) {
      json.checkObj(elem);

      // Should check that elem[key] == c.od
      elem[key] = c.oi;
    }

    // Object delete
    else if (c.od !== void 0) {
      json.checkObj(elem);

      // Should check that elem[key] == c.od
      delete elem[key];
    }

    else {
      throw new Error('invalid / missing instruction in op');
    }
  }

  return container.data;
};

// Helper to break an operation up into a bunch of small ops.
json.shatter = function(op) {
  var results = [];
  for (var i = 0; i < op.length; i++) {
    results.push([op[i]]);
  }
  return results;
};

// Helper for incrementally applying an operation to a snapshot. Calls yield
// after each op component has been applied.
json.incrementalApply = function(snapshot, op, _yield) {
  for (var i = 0; i < op.length; i++) {
    var smallOp = [op[i]];
    snapshot = json.apply(snapshot, smallOp);
    // I'd just call this yield, but thats a reserved keyword. Bah!
    _yield(smallOp, snapshot);
  }

  return snapshot;
};

// Checks if two paths, p1 and p2 match.
var pathMatches = json.pathMatches = function(p1, p2, ignoreLast) {
  if (p1.length != p2.length)
    return false;

  for (var i = 0; i < p1.length; i++) {
    if (p1[i] !== p2[i] && (!ignoreLast || i !== p1.length - 1))
      return false;
  }

  return true;
};

json.append = function(dest,c) {
  c = clone(c);

  if (dest.length === 0) {
    dest.push(c);
    return;
  }

  var last = dest[dest.length - 1];

  // convert old string ops to use subtype for backwards compatibility
  if ((c.si != null || c.sd != null) && (last.si != null || last.sd != null)) {
    convertFromText(c);
    convertFromText(last);
  }

  if (pathMatches(c.p, last.p)) {
    // handle subtype ops
    if (c.t && last.t && c.t === last.t && subtypes[c.t]) {
      last.o = subtypes[c.t].compose(last.o, c.o);

      // convert back to old string ops
      if (c.si != null || c.sd != null) {
        var p = c.p;
        for (var i = 0; i < last.o.length - 1; i++) {
          c.o = [last.o.pop()];
          c.p = p.slice();
          convertToText(c);
          dest.push(c);
        }

        convertToText(last);
      }
    } else if (last.na != null && c.na != null) {
      dest[dest.length - 1] = {p: last.p, na: last.na + c.na};
    } else if (last.li !== undefined && c.li === undefined && c.ld === last.li) {
      // insert immediately followed by delete becomes a noop.
      if (last.ld !== undefined) {
        // leave the delete part of the replace
        delete last.li;
      } else {
        dest.pop();
      }
    } else if (last.od !== undefined && last.oi === undefined && c.oi !== undefined && c.od === undefined) {
      last.oi = c.oi;
    } else if (last.oi !== undefined && c.od !== undefined) {
      // The last path component inserted something that the new component deletes (or replaces).
      // Just merge them.
      if (c.oi !== undefined) {
        last.oi = c.oi;
      } else if (last.od !== undefined) {
        delete last.oi;
      } else {
        // An insert directly followed by a delete turns into a no-op and can be removed.
        dest.pop();
      }
    } else if (c.lm !== undefined && c.p[c.p.length - 1] === c.lm) {
      // don't do anything
    } else {
      dest.push(c);
    }
  } else {
    // convert string ops back
    if ((c.si != null || c.sd != null) && (last.si != null || last.sd != null)) {
      convertToText(c);
      convertToText(last);
    }

    dest.push(c);
  }
};

json.compose = function(op1,op2) {
  json.checkValidOp(op1);
  json.checkValidOp(op2);

  var newOp = clone(op1);

  for (var i = 0; i < op2.length; i++) {
    json.append(newOp,op2[i]);
  }

  return newOp;
};

json.normalize = function(op) {
  var newOp = [];

  op = isArray(op) ? op : [op];

  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (c.p == null) c.p = [];

    json.append(newOp,c);
  }

  return newOp;
};

// Returns the common length of the paths of ops a and b
json.commonLengthForOps = function(a, b) {
  var alen = a.p.length;
  var blen = b.p.length;
  if (a.na != null || a.t)
    alen++;

  if (b.na != null || b.t)
    blen++;

  if (alen === 0) return -1;
  if (blen === 0) return null;

  alen--;
  blen--;

  for (var i = 0; i < alen; i++) {
    var p = a.p[i];
    if (i >= blen || p !== b.p[i])
      return null;
  }

  return alen;
};

// Returns true if an op can affect the given path
json.canOpAffectPath = function(op, path) {
  return json.commonLengthForOps({p:path}, op) != null;
};

// transform c so it applies to a document with otherC applied.
json.transformComponent = function(dest, c, otherC, type) {
  c = clone(c);

  var common = json.commonLengthForOps(otherC, c);
  var common2 = json.commonLengthForOps(c, otherC);
  var cplength = c.p.length;
  var otherCplength = otherC.p.length;

  if (c.na != null || c.t)
    cplength++;

  if (otherC.na != null || otherC.t)
    otherCplength++;

  // if c is deleting something, and that thing is changed by otherC, we need to
  // update c to reflect that change for invertibility.
  if (common2 != null && otherCplength > cplength && c.p[common2] == otherC.p[common2]) {
    if (c.ld !== void 0) {
      var oc = clone(otherC);
      oc.p = oc.p.slice(cplength);
      c.ld = json.apply(clone(c.ld),[oc]);
    } else if (c.od !== void 0) {
      var oc = clone(otherC);
      oc.p = oc.p.slice(cplength);
      c.od = json.apply(clone(c.od),[oc]);
    }
  }

  if (common != null) {
    var commonOperand = cplength == otherCplength;

    // backward compatibility for old string ops
    var oc = otherC;
    if ((c.si != null || c.sd != null) && (otherC.si != null || otherC.sd != null)) {
      convertFromText(c);
      oc = clone(otherC);
      convertFromText(oc);
    }

    // handle subtype ops
    if (oc.t && subtypes[oc.t]) {
      if (c.t && c.t === oc.t) {
        var res = subtypes[c.t].transform(c.o, oc.o, type);

        if (res.length > 0) {
          // convert back to old string ops
          if (c.si != null || c.sd != null) {
            var p = c.p;
            for (var i = 0; i < res.length; i++) {
              c.o = [res[i]];
              c.p = p.slice();
              convertToText(c);
              json.append(dest, c);
            }
          } else {
            c.o = res;
            json.append(dest, c);
          }
        }

        return dest;
      }
    }

    // transform based on otherC
    else if (otherC.na !== void 0) {
      // this case is handled below
    } else if (otherC.li !== void 0 && otherC.ld !== void 0) {
      if (otherC.p[common] === c.p[common]) {
        // noop

        if (!commonOperand) {
          return dest;
        } else if (c.ld !== void 0) {
          // we're trying to delete the same element, -> noop
          if (c.li !== void 0 && type === 'left') {
            // we're both replacing one element with another. only one can survive
            c.ld = clone(otherC.li);
          } else {
            return dest;
          }
        }
      }
    } else if (otherC.li !== void 0) {
      if (c.li !== void 0 && c.ld === undefined && commonOperand && c.p[common] === otherC.p[common]) {
        // in li vs. li, left wins.
        if (type === 'right')
          c.p[common]++;
      } else if (otherC.p[common] <= c.p[common]) {
        c.p[common]++;
      }

      if (c.lm !== void 0) {
        if (commonOperand) {
          // otherC edits the same list we edit
          if (otherC.p[common] <= c.lm)
            c.lm++;
          // changing c.from is handled above.
        }
      }
    } else if (otherC.ld !== void 0) {
      if (c.lm !== void 0) {
        if (commonOperand) {
          if (otherC.p[common] === c.p[common]) {
            // they deleted the thing we're trying to move
            return dest;
          }
          // otherC edits the same list we edit
          var p = otherC.p[common];
          var from = c.p[common];
          var to = c.lm;
          if (p < to || (p === to && from < to))
            c.lm--;

        }
      }

      if (otherC.p[common] < c.p[common]) {
        c.p[common]--;
      } else if (otherC.p[common] === c.p[common]) {
        if (otherCplength < cplength) {
          // we're below the deleted element, so -> noop
          return dest;
        } else if (c.ld !== void 0) {
          if (c.li !== void 0) {
            // we're replacing, they're deleting. we become an insert.
            delete c.ld;
          } else {
            // we're trying to delete the same element, -> noop
            return dest;
          }
        }
      }

    } else if (otherC.lm !== void 0) {
      if (c.lm !== void 0 && cplength === otherCplength) {
        // lm vs lm, here we go!
        var from = c.p[common];
        var to = c.lm;
        var otherFrom = otherC.p[common];
        var otherTo = otherC.lm;
        if (otherFrom !== otherTo) {
          // if otherFrom == otherTo, we don't need to change our op.

          // where did my thing go?
          if (from === otherFrom) {
            // they moved it! tie break.
            if (type === 'left') {
              c.p[common] = otherTo;
              if (from === to) // ugh
                c.lm = otherTo;
            } else {
              return dest;
            }
          } else {
            // they moved around it
            if (from > otherFrom) c.p[common]--;
            if (from > otherTo) c.p[common]++;
            else if (from === otherTo) {
              if (otherFrom > otherTo) {
                c.p[common]++;
                if (from === to) // ugh, again
                  c.lm++;
              }
            }

            // step 2: where am i going to put it?
            if (to > otherFrom) {
              c.lm--;
            } else if (to === otherFrom) {
              if (to > from)
                c.lm--;
            }
            if (to > otherTo) {
              c.lm++;
            } else if (to === otherTo) {
              // if we're both moving in the same direction, tie break
              if ((otherTo > otherFrom && to > from) ||
                  (otherTo < otherFrom && to < from)) {
                if (type === 'right') c.lm++;
              } else {
                if (to > from) c.lm++;
                else if (to === otherFrom) c.lm--;
              }
            }
          }
        }
      } else if (c.li !== void 0 && c.ld === undefined && commonOperand) {
        // li
        var from = otherC.p[common];
        var to = otherC.lm;
        p = c.p[common];
        if (p > from) c.p[common]--;
        if (p > to) c.p[common]++;
      } else {
        // ld, ld+li, si, sd, na, oi, od, oi+od, any li on an element beneath
        // the lm
        //
        // i.e. things care about where their item is after the move.
        var from = otherC.p[common];
        var to = otherC.lm;
        p = c.p[common];
        if (p === from) {
          c.p[common] = to;
        } else {
          if (p > from) c.p[common]--;
          if (p > to) c.p[common]++;
          else if (p === to && from > to) c.p[common]++;
        }
      }
    }
    else if (otherC.oi !== void 0 && otherC.od !== void 0) {
      if (c.p[common] === otherC.p[common]) {
        if (c.oi !== void 0 && commonOperand) {
          // we inserted where someone else replaced
          if (type === 'right') {
            // left wins
            return dest;
          } else {
            // we win, make our op replace what they inserted
            c.od = otherC.oi;
          }
        } else {
          // -> noop if the other component is deleting the same object (or any parent)
          return dest;
        }
      }
    } else if (otherC.oi !== void 0) {
      if (c.oi !== void 0 && c.p[common] === otherC.p[common]) {
        // left wins if we try to insert at the same place
        if (type === 'left') {
          json.append(dest,{p: c.p, od:otherC.oi});
        } else {
          return dest;
        }
      }
    } else if (otherC.od !== void 0) {
      if (c.p[common] == otherC.p[common]) {
        if (!commonOperand)
          return dest;
        if (c.oi !== void 0) {
          delete c.od;
        } else {
          return dest;
        }
      }
    }
  }

  json.append(dest,c);
  return dest;
};

require('./bootstrapTransform')(json, json.transformComponent, json.checkValidOp, json.append);

/**
 * Register a subtype for string operations, using the text0 type.
 */
var text = require('./text0');

json.registerSubtype(text);
module.exports = json;


},{"./bootstrapTransform":11,"./text0":14}],14:[function(require,module,exports){
// DEPRECATED!
//
// This type works, but is not exported. Its included here because the JSON0
// embedded string operations use this library.


// A simple text implementation
//
// Operations are lists of components. Each component either inserts or deletes
// at a specified position in the document.
//
// Components are either:
//  {i:'str', p:100}: Insert 'str' at position 100 in the document
//  {d:'str', p:100}: Delete 'str' at position 100 in the document
//
// Components in an operation are executed sequentially, so the position of components
// assumes previous components have already executed.
//
// Eg: This op:
//   [{i:'abc', p:0}]
// is equivalent to this op:
//   [{i:'a', p:0}, {i:'b', p:1}, {i:'c', p:2}]

var text = module.exports = {
  name: 'text0',
  uri: 'http://sharejs.org/types/textv0',
  create: function(initial) {
    if ((initial != null) && typeof initial !== 'string') {
      throw new Error('Initial data must be a string');
    }
    return initial || '';
  }
};

/** Insert s2 into s1 at pos. */
var strInject = function(s1, pos, s2) {
  return s1.slice(0, pos) + s2 + s1.slice(pos);
};

/** Check that an operation component is valid. Throws if its invalid. */
var checkValidComponent = function(c) {
  if (typeof c.p !== 'number')
    throw new Error('component missing position field');

  if ((typeof c.i === 'string') === (typeof c.d === 'string'))
    throw new Error('component needs an i or d field');

  if (c.p < 0)
    throw new Error('position cannot be negative');
};

/** Check that an operation is valid */
var checkValidOp = function(op) {
  for (var i = 0; i < op.length; i++) {
    checkValidComponent(op[i]);
  }
};

/** Apply op to snapshot */
text.apply = function(snapshot, op) {
  var deleted;

  checkValidOp(op);
  for (var i = 0; i < op.length; i++) {
    var component = op[i];
    if (component.i != null) {
      snapshot = strInject(snapshot, component.p, component.i);
    } else {
      deleted = snapshot.slice(component.p, component.p + component.d.length);
      if (component.d !== deleted)
        throw new Error("Delete component '" + component.d + "' does not match deleted text '" + deleted + "'");

      snapshot = snapshot.slice(0, component.p) + snapshot.slice(component.p + component.d.length);
    }
  }
  return snapshot;
};

/**
 * Append a component to the end of newOp. Exported for use by the random op
 * generator and the JSON0 type.
 */
var append = text._append = function(newOp, c) {
  if (c.i === '' || c.d === '') return;

  if (newOp.length === 0) {
    newOp.push(c);
  } else {
    var last = newOp[newOp.length - 1];

    if (last.i != null && c.i != null && last.p <= c.p && c.p <= last.p + last.i.length) {
      // Compose the insert into the previous insert
      newOp[newOp.length - 1] = {i:strInject(last.i, c.p - last.p, c.i), p:last.p};

    } else if (last.d != null && c.d != null && c.p <= last.p && last.p <= c.p + c.d.length) {
      // Compose the deletes together
      newOp[newOp.length - 1] = {d:strInject(c.d, last.p - c.p, last.d), p:c.p};

    } else {
      newOp.push(c);
    }
  }
};

/** Compose op1 and op2 together */
text.compose = function(op1, op2) {
  checkValidOp(op1);
  checkValidOp(op2);
  var newOp = op1.slice();
  for (var i = 0; i < op2.length; i++) {
    append(newOp, op2[i]);
  }
  return newOp;
};

/** Clean up an op */
text.normalize = function(op) {
  var newOp = [];

  // Normalize should allow ops which are a single (unwrapped) component:
  // {i:'asdf', p:23}.
  // There's no good way to test if something is an array:
  // http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
  // so this is probably the least bad solution.
  if (op.i != null || op.p != null) op = [op];

  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (c.p == null) c.p = 0;

    append(newOp, c);
  }

  return newOp;
};

// This helper method transforms a position by an op component.
//
// If c is an insert, insertAfter specifies whether the transform
// is pushed after the insert (true) or before it (false).
//
// insertAfter is optional for deletes.
var transformPosition = function(pos, c, insertAfter) {
  // This will get collapsed into a giant ternary by uglify.
  if (c.i != null) {
    if (c.p < pos || (c.p === pos && insertAfter)) {
      return pos + c.i.length;
    } else {
      return pos;
    }
  } else {
    // I think this could also be written as: Math.min(c.p, Math.min(c.p -
    // otherC.p, otherC.d.length)) but I think its harder to read that way, and
    // it compiles using ternary operators anyway so its no slower written like
    // this.
    if (pos <= c.p) {
      return pos;
    } else if (pos <= c.p + c.d.length) {
      return c.p;
    } else {
      return pos - c.d.length;
    }
  }
};

// Helper method to transform a cursor position as a result of an op.
//
// Like transformPosition above, if c is an insert, insertAfter specifies
// whether the cursor position is pushed after an insert (true) or before it
// (false).
text.transformCursor = function(position, op, side) {
  var insertAfter = side === 'right';
  for (var i = 0; i < op.length; i++) {
    position = transformPosition(position, op[i], insertAfter);
  }

  return position;
};

// Transform an op component by another op component. Asymmetric.
// The result will be appended to destination.
//
// exported for use in JSON type
var transformComponent = text._tc = function(dest, c, otherC, side) {
  //var cIntersect, intersectEnd, intersectStart, newC, otherIntersect, s;

  checkValidComponent(c);
  checkValidComponent(otherC);

  if (c.i != null) {
    // Insert.
    append(dest, {i:c.i, p:transformPosition(c.p, otherC, side === 'right')});
  } else {
    // Delete
    if (otherC.i != null) {
      // Delete vs insert
      var s = c.d;
      if (c.p < otherC.p) {
        append(dest, {d:s.slice(0, otherC.p - c.p), p:c.p});
        s = s.slice(otherC.p - c.p);
      }
      if (s !== '')
        append(dest, {d: s, p: c.p + otherC.i.length});

    } else {
      // Delete vs delete
      if (c.p >= otherC.p + otherC.d.length)
        append(dest, {d: c.d, p: c.p - otherC.d.length});
      else if (c.p + c.d.length <= otherC.p)
        append(dest, c);
      else {
        // They overlap somewhere.
        var newC = {d: '', p: c.p};

        if (c.p < otherC.p)
          newC.d = c.d.slice(0, otherC.p - c.p);

        if (c.p + c.d.length > otherC.p + otherC.d.length)
          newC.d += c.d.slice(otherC.p + otherC.d.length - c.p);

        // This is entirely optional - I'm just checking the deleted text in
        // the two ops matches
        var intersectStart = Math.max(c.p, otherC.p);
        var intersectEnd = Math.min(c.p + c.d.length, otherC.p + otherC.d.length);
        var cIntersect = c.d.slice(intersectStart - c.p, intersectEnd - c.p);
        var otherIntersect = otherC.d.slice(intersectStart - otherC.p, intersectEnd - otherC.p);
        if (cIntersect !== otherIntersect)
          throw new Error('Delete ops delete different text in the same region of the document');

        if (newC.d !== '') {
          newC.p = transformPosition(newC.p, otherC);
          append(dest, newC);
        }
      }
    }
  }

  return dest;
};

var invertComponent = function(c) {
  return (c.i != null) ? {d:c.i, p:c.p} : {i:c.d, p:c.p};
};

// No need to use append for invert, because the components won't be able to
// cancel one another.
text.invert = function(op) {
  // Shallow copy & reverse that sucka.
  op = op.slice().reverse();
  for (var i = 0; i < op.length; i++) {
    op[i] = invertComponent(op[i]);
  }
  return op;
};

require('./bootstrapTransform')(text, transformComponent, checkValidOp, append);

},{"./bootstrapTransform":11}],15:[function(require,module,exports){
module.exports = {
  type: require('./text-tp2')
};

},{"./text-tp2":16}],16:[function(require,module,exports){
// A TP2 implementation of text, following this spec:
// http://code.google.com/p/lightwave/source/browse/trunk/experimental/ot/README
//
// A document is made up of a string and a set of tombstones inserted throughout
// the string. For example, 'some ', (2 tombstones), 'string'.
//
// This is encoded in a document as ['some ', (2 tombstones), 'string']
// (It should be encoded as {s:'some string', t:[5, -2, 6]} because thats
// faster in JS, but its not.)
//
// Ops are lists of components which iterate over the whole document. (I might
// change this at some point, but a version thats less strict is backwards
// compatible.)
//
// Components are either:
//   N:         Skip N characters in the original document
//   {i:'str'}: Insert 'str' at the current position in the document
//   {i:N}:     Insert N tombstones at the current position in the document
//   {d:N}:     Delete (tombstone) N characters at the current position in the document
//
// Eg: [3, {i:'hi'}, 5, {d:8}]
//
// Snapshots are lists with characters and tombstones. Characters are stored in strings
// and adjacent tombstones are flattened into numbers.
//
// Eg, the document: 'Hello .....world' ('.' denotes tombstoned (deleted) characters)
// would be represented by a document snapshot of ['Hello ', 5, 'world']

var type = module.exports = {
  name: 'text-tp2',
  tp2: true,
  uri: 'http://sharejs.org/types/text-tp2v1',
  create: function(initial) {
    if (initial == null) {
      initial = '';
    } else {
      if (typeof initial != 'string') throw new Error('Initial data must be a string');
    }

    return {
      charLength: initial.length,
      totalLength: initial.length,
      data: initial.length ? [initial] : []
    };
  },

  serialize: function(doc) {
    if (!doc.data) {
      throw new Error('invalid doc snapshot');
    }
    return doc.data;
  },

  deserialize: function(data) {
    var doc = type.create();
    doc.data = data;

    for (var i = 0; i < data.length; i++) {
      var component = data[i];

      if (typeof component === 'string') {
        doc.charLength += component.length;
        doc.totalLength += component.length;
      } else {
        doc.totalLength += component;
      }
    }

    return doc;
  }
};

var isArray = Array.isArray || function(obj) {
  return Object.prototype.toString.call(obj) == '[object Array]';
};

var checkOp = function(op) {
  if (!isArray(op)) throw new Error('Op must be an array of components');

  var last = null;
  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (typeof c == 'object') {
      // The component is an insert or a delete.
      if (c.i !== undefined) { // Insert.
        if (!((typeof c.i === 'string' && c.i.length > 0) // String inserts
              || (typeof c.i === 'number' && c.i > 0))) // Tombstone inserts
          throw new Error('Inserts must insert a string or a +ive number');

      } else if (c.d !== undefined) { // Delete
        if (!(typeof c.d === 'number' && c.d > 0))
          throw new Error('Deletes must be a +ive number');

      } else throw new Error('Operation component must define .i or .d');

    } else {
      // The component must be a skip.
      if (typeof c != 'number') throw new Error('Op components must be objects or numbers');

      if (c <= 0) throw new Error('Skip components must be a positive number');
      if (typeof last === 'number') throw new Error('Adjacent skip components should be combined');
    }

    last = c;
  }
};

// Take the next part from the specified position in a document snapshot.
// position = {index, offset}. It will be updated.
var takeDoc = type._takeDoc = function(doc, position, maxlength, tombsIndivisible) {
  if (position.index >= doc.data.length)
    throw new Error('Operation goes past the end of the document');

  var part = doc.data[position.index];

  // This can be written as an ugly-arsed giant ternary statement, but its much
  // more readable like this. Uglify will convert it into said ternary anyway.
  var result;
  if (typeof part == 'string') {
    if (maxlength != null) {
      result = part.slice(position.offset, position.offset + maxlength);
    } else {
      result = part.slice(position.offset);
    }
  } else {
    if (maxlength == null || tombsIndivisible) {
      result = part - position.offset;
    } else {
      result = Math.min(maxlength, part - position.offset);
    }
  }

  var resultLen = result.length || result;

  if ((part.length || part) - position.offset > resultLen) {
    position.offset += resultLen;
  } else {
    position.index++;
    position.offset = 0;
  }

  return result;
};

// Append a part to the end of a document
var appendDoc = type._appendDoc = function(doc, p) {
  if (p === 0 || p === '') return;

  if (typeof p === 'string') {
    doc.charLength += p.length;
    doc.totalLength += p.length;
  } else {
    doc.totalLength += p;
  }

  var data = doc.data;
  if (data.length === 0) {
    data.push(p);
  } else if (typeof data[data.length - 1] === typeof p) {
    data[data.length - 1] += p;
  } else {
    data.push(p);
  }
};

// Apply the op to the document. The document is not modified in the process.
type.apply = function(doc, op) {
  if (doc.totalLength == null || doc.charLength == null || !isArray(doc.data)) {
    throw new Error('Snapshot is invalid');
  }
  checkOp(op);

  var newDoc = type.create();
  var position = {index: 0, offset: 0};

  for (var i = 0; i < op.length; i++) {
    var component = op[i];
    var remainder, part;

    if (typeof component == 'number') { // Skip
      remainder = component;
      while (remainder > 0) {
        part = takeDoc(doc, position, remainder);
        appendDoc(newDoc, part);
        remainder -= part.length || part;
      }

    } else if (component.i !== undefined) { // Insert
      appendDoc(newDoc, component.i);

    } else if (component.d !== undefined) { // Delete
      remainder = component.d;
      while (remainder > 0) {
        part = takeDoc(doc, position, remainder);
        remainder -= part.length || part;
      }
      appendDoc(newDoc, component.d);
    }
  }
  return newDoc;
};

// Append an op component to the end of the specified op.  Exported for the
// randomOpGenerator.
var append = type._append = function(op, component) {
  var last;

  if (component === 0 || component.i === '' || component.i === 0 || component.d === 0) {
    // Drop the new component.
  } else if (op.length === 0) {
    op.push(component);
  } else {
    last = op[op.length - 1];
    if (typeof component == 'number' && typeof last == 'number') {
      op[op.length - 1] += component;
    } else if (component.i != null && (last.i != null) && typeof last.i === typeof component.i) {
      last.i += component.i;
    } else if (component.d != null && (last.d != null)) {
      last.d += component.d;
    } else {
      op.push(component);
    }
  }
};

var take = function(op, cursor, maxlength, insertsIndivisible) {
  if (cursor.index === op.length) return null;
  var e = op[cursor.index];
  var current;
  var result;

  var offset = cursor.offset;

  // if the current element is a skip, an insert of a number or a delete
  if (typeof (current = e) == 'number' || typeof (current = e.i) == 'number' || (current = e.d) != null) {
    var c;
    if ((maxlength == null) || current - offset <= maxlength || (insertsIndivisible && e.i != null)) {
      // Return the rest of the current element.
      c = current - offset;
      ++cursor.index;
      cursor.offset = 0;
    } else {
      cursor.offset += maxlength;
      c = maxlength;
    }

    // Package the component back up.
    if (e.i != null) {
      return {i: c};
    } else if (e.d != null) {
      return {d: c};
    } else {
      return c;
    }
  } else { // Insert of a string.
    if ((maxlength == null) || e.i.length - offset <= maxlength || insertsIndivisible) {
      result = {i: e.i.slice(offset)};
      ++cursor.index;
      cursor.offset = 0;
    } else {
      result = {i: e.i.slice(offset, offset + maxlength)};
      cursor.offset += maxlength;
    }
    return result;
  }
};

// Find and return the length of an op component
var componentLength = function(component) {
  if (typeof component === 'number') {
    return component;
  } else if (typeof component.i === 'string') {
    return component.i.length;
  } else {
    return component.d || component.i;
  }
};

// Normalize an op, removing all empty skips and empty inserts / deletes.
// Concatenate adjacent inserts and deletes.
type.normalize = function(op) {
  var newOp = [];
  for (var i = 0; i < op.length; i++) {
    append(newOp, op[i]);
  }
  return newOp;
};

// This is a helper method to transform and prune. goForwards is true for transform, false for prune.
var transformer = function(op, otherOp, goForwards, side) {
  checkOp(op);
  checkOp(otherOp);

  var newOp = [];

  // Cursor moving over op. Used by take
  var cursor = {index:0, offset:0};

  for (var i = 0; i < otherOp.length; i++) {
    var component = otherOp[i];
    var len = componentLength(component);
    var chunk;

    if (component.i != null) { // Insert text or tombs
      if (goForwards) { // Transform - insert skips over deleted parts.
        if (side === 'left') {
          // The left side insert should go first.
          var next;
          while ((next = op[cursor.index]) && next.i != null) {
            append(newOp, take(op, cursor));
          }
        }
        // In any case, skip the inserted text.
        append(newOp, len);

      } else { // Prune. Remove skips for inserts.
        while (len > 0) {
          chunk = take(op, cursor, len, true);

          // The chunk will be null if we run out of components in the other op.
          if (chunk === null) throw new Error('The transformed op is invalid');
          if (chunk.d != null)
            throw new Error('The transformed op deletes locally inserted characters - it cannot be purged of the insert.');

          if (typeof chunk == 'number')
            len -= chunk;
          else
            append(newOp, chunk);
        }
      }
    } else { // Skips or deletes.
      while (len > 0) {
        chunk = take(op, cursor, len, true);
        if (chunk === null) throw new Error('The op traverses more elements than the document has');

        append(newOp, chunk);
        if (!chunk.i) len -= componentLength(chunk);
      }
    }
  }

  // Append extras from op1.
  var component;
  while ((component = take(op, cursor))) {
    if (component.i === undefined) {
      throw new Error("Remaining fragments in the op: " + component);
    }
    append(newOp, component);
  }
  return newOp;
};

// transform op1 by op2. Return transformed version of op1. op1 and op2 are
// unchanged by transform. Side should be 'left' or 'right', depending on if
// op1.id <> op2.id.
//
// 'left' == client op for ShareJS.
type.transform = function(op, otherOp, side) {
  if (side != 'left' && side != 'right')
    throw new Error("side (" + side + ") should be 'left' or 'right'");

  return transformer(op, otherOp, true, side);
};

type.prune = function(op, otherOp) {
  return transformer(op, otherOp, false);
};

type.compose = function(op1, op2) {
  //var chunk, chunkLength, component, length, result, take, _, _i, _len, _ref;
  if (op1 == null) return op2;

  checkOp(op1);
  checkOp(op2);

  var result = [];

  // Cursor over op1.
  var cursor = {index:0, offset:0};

  var component;

  for (var i = 0; i < op2.length; i++) {
    component = op2[i];
    var len, chunk;

    if (typeof component === 'number') { // Skip
      // Just copy from op1.
      len = component;
      while (len > 0) {
        chunk = take(op1, cursor, len);
        if (chunk === null)
          throw new Error('The op traverses more elements than the document has');

        append(result, chunk);
        len -= componentLength(chunk);
      }

    } else if (component.i !== undefined) { // Insert
      append(result, {i: component.i});

    } else { // Delete
      len = component.d;
      while (len > 0) {
        chunk = take(op1, cursor, len);
        if (chunk === null)
          throw new Error('The op traverses more elements than the document has');

        var chunkLength = componentLength(chunk);

        if (chunk.i !== undefined)
          append(result, {i: chunkLength});
        else
          append(result, {d: chunkLength});

        len -= chunkLength;
      }
    }
  }

  // Append extras from op1.
  while ((component = take(op1, cursor))) {
    if (component.i === undefined) {
      throw new Error("Remaining fragments in op1: " + component);
    }
    append(result, component);
  }
  return result;
};


},{}],17:[function(require,module,exports){
// Text document API for the 'text' type. This implements some standard API
// methods for any text-like type, so you can easily bind a textarea or
// something without being fussy about the underlying OT implementation.
//
// The API is desigend as a set of functions to be mixed in to some context
// object as part of its lifecycle. It expects that object to have getSnapshot
// and submitOp methods, and call _onOp when an operation is received.
//
// This API defines:
//
// - getLength() returns the length of the document in characters
// - getText() returns a string of the document
// - insert(pos, text, [callback]) inserts text at position pos in the document
// - remove(pos, length, [callback]) removes length characters at position pos
//
// A user can define:
// - onInsert(pos, text): Called when text is inserted.
// - onRemove(pos, length): Called when text is removed.

module.exports = api;
function api(getSnapshot, submitOp) {
  return {
    // Returns the text content of the document
    get: function() { return getSnapshot(); },

    // Returns the number of characters in the string
    getLength: function() { return getSnapshot().length; },

    // Insert the specified text at the given position in the document
    insert: function(pos, text, callback) {
      return submitOp([pos, text], callback);
    },

    remove: function(pos, length, callback) {
      return submitOp([pos, {d:length}], callback);
    },

    // When you use this API, you should implement these two methods
    // in your editing context.
    //onInsert: function(pos, text) {},
    //onRemove: function(pos, removedLength) {},

    _onOp: function(op) {
      var pos = 0;
      var spos = 0;
      for (var i = 0; i < op.length; i++) {
        var component = op[i];
        switch (typeof component) {
          case 'number':
            pos += component;
            spos += component;
            break;
          case 'string':
            if (this.onInsert) this.onInsert(pos, component);
            pos += component.length;
            break;
          case 'object':
            if (this.onRemove) this.onRemove(pos, component.d);
            spos += component.d;
        }
      }
    }
  };
};
api.provides = {text: true};

},{}],18:[function(require,module,exports){
var type = require('./text');
type.api = require('./api');

module.exports = {
  type: type
};

},{"./api":17,"./text":19}],19:[function(require,module,exports){
/* Text OT!
 *
 * This is an OT implementation for text. It is the standard implementation of
 * text used by ShareJS.
 *
 * This type is composable but non-invertable. Its similar to ShareJS's old
 * text-composable type, but its not invertable and its very similar to the
 * text-tp2 implementation but it doesn't support tombstones or purging.
 *
 * Ops are lists of components which iterate over the document.
 * Components are either:
 *   A number N: Skip N characters in the original document
 *   "str"     : Insert "str" at the current position in the document
 *   {d:N}     : Delete N characters at the current position in the document
 *
 * Eg: [3, 'hi', 5, {d:8}]
 *
 * The operation does not have to skip the last characters in the document.
 *
 * Snapshots are strings.
 *
 * Cursors are either a single number (which is the cursor position) or a pair of
 * [anchor, focus] (aka [start, end]). Be aware that end can be before start.
 */

/** @module text */

exports.name = 'text';
exports.uri = 'http://sharejs.org/types/textv1';

/** Create a new text snapshot.
 *
 * @param {string} initial - initial snapshot data. Optional. Defaults to ''.
 */
exports.create = function(initial) {
  if ((initial != null) && typeof initial !== 'string') {
    throw Error('Initial data must be a string');
  }
  return initial || '';
};

var isArray = Array.isArray || function(obj) {
  return Object.prototype.toString.call(obj) === "[object Array]";
};

/** Check the operation is valid. Throws if not valid. */
var checkOp = function(op) {
  if (!isArray(op)) throw Error('Op must be an array of components');

  var last = null;
  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    switch (typeof c) {
      case 'object':
        // The only valid objects are {d:X} for +ive values of X.
        if (!(typeof c.d === 'number' && c.d > 0)) throw Error('Object components must be deletes of size > 0');
        break;
      case 'string':
        // Strings are inserts.
        if (!(c.length > 0)) throw Error('Inserts cannot be empty');
        break;
      case 'number':
        // Numbers must be skips. They have to be +ive numbers.
        if (!(c > 0)) throw Error('Skip components must be >0');
        if (typeof last === 'number') throw Error('Adjacent skip components should be combined');
        break;
    }
    last = c;
  }

  if (typeof last === 'number') throw Error('Op has a trailing skip');
};

/** Check that the given selection range is valid. */
var checkSelection = function(selection) {
  // This may throw from simply inspecting selection[0] / selection[1]. Thats
  // sort of ok, though it'll generate the wrong message.
  if (typeof selection !== 'number'
      && (typeof selection[0] !== 'number' || typeof selection[1] !== 'number'))
    throw Error('Invalid selection');
};

/** Make a function that appends to the given operation. */
var makeAppend = function(op) {
  return function(component) {
    if (!component || component.d === 0) {
      // The component is a no-op. Ignore!

    } else if (op.length === 0) {
      return op.push(component);

    } else if (typeof component === typeof op[op.length - 1]) {
      if (typeof component === 'object') {
        return op[op.length - 1].d += component.d;
      } else {
        return op[op.length - 1] += component;
      }
    } else {
      return op.push(component);
    }
  };
};

/** Makes and returns utility functions take and peek. */
var makeTake = function(op) {
  // The index of the next component to take
  var idx = 0;
  // The offset into the component
  var offset = 0;

  // Take up to length n from the front of op. If n is -1, take the entire next
  // op component. If indivisableField == 'd', delete components won't be separated.
  // If indivisableField == 'i', insert components won't be separated.
  var take = function(n, indivisableField) {
    // We're at the end of the operation. The op has skips, forever. Infinity
    // might make more sense than null here.
    if (idx === op.length)
      return n === -1 ? null : n;

    var part;
    var c = op[idx];
    if (typeof c === 'number') {
      // Skip
      if (n === -1 || c - offset <= n) {
        part = c - offset;
        ++idx;
        offset = 0;
        return part;
      } else {
        offset += n;
        return n;
      }
    } else if (typeof c === 'string') {
      // Insert
      if (n === -1 || indivisableField === 'i' || c.length - offset <= n) {
        part = c.slice(offset);
        ++idx;
        offset = 0;
        return part;
      } else {
        part = c.slice(offset, offset + n);
        offset += n;
        return part;
      }
    } else {
      // Delete
      if (n === -1 || indivisableField === 'd' || c.d - offset <= n) {
        part = {d: c.d - offset};
        ++idx;
        offset = 0;
        return part;
      } else {
        offset += n;
        return {d: n};
      }
    }
  };

  // Peek at the next op that will be returned.
  var peekType = function() { return op[idx]; };

  return [take, peekType];
};

/** Get the length of a component */
var componentLength = function(c) {
  // Uglify will compress this down into a ternary
  if (typeof c === 'number') {
    return c;
  } else {
    return c.length || c.d;
  }
};

/** Trim any excess skips from the end of an operation.
 *
 * There should only be at most one, because the operation was made with append.
 */
var trim = function(op) {
  if (op.length > 0 && typeof op[op.length - 1] === 'number') {
    op.pop();
  }
  return op;
};

exports.normalize = function(op) {
  var newOp = [];
  var append = makeAppend(newOp);
  for (var i = 0; i < op.length; i++) {
    append(op[i]);
  }
  return trim(newOp);
};

/** Apply an operation to a document snapshot */
exports.apply = function(str, op) {
  if (typeof str !== 'string') {
    throw Error('Snapshot should be a string');
  }
  checkOp(op);

  // We'll gather the new document here and join at the end.
  var newDoc = [];

  for (var i = 0; i < op.length; i++) {
    var component = op[i];
    switch (typeof component) {
      case 'number':
        if (component > str.length) throw Error('The op is too long for this document');

        newDoc.push(str.slice(0, component));
        // This might be slow for big strings. Consider storing the offset in
        // str instead of rewriting it each time.
        str = str.slice(component);
        break;
      case 'string':
        newDoc.push(component);
        break;
      case 'object':
        str = str.slice(component.d);
        break;
    }
  }

  return newDoc.join('') + str;
};

/** Transform op by otherOp.
 *
 * @param op - The operation to transform
 * @param otherOp - Operation to transform it by
 * @param side - Either 'left' or 'right'
 */
exports.transform = function(op, otherOp, side) {
  if (side != 'left' && side != 'right') throw Error("side (" + side + ") must be 'left' or 'right'");

  checkOp(op);
  checkOp(otherOp);

  var newOp = [];
  var append = makeAppend(newOp);

  var _fns = makeTake(op);
  var take = _fns[0],
      peek = _fns[1];

  for (var i = 0; i < otherOp.length; i++) {
    var component = otherOp[i];

    var length, chunk;
    switch (typeof component) {
      case 'number': // Skip
        length = component;
        while (length > 0) {
          chunk = take(length, 'i');
          append(chunk);
          if (typeof chunk !== 'string') {
            length -= componentLength(chunk);
          }
        }
        break;

      case 'string': // Insert
        if (side === 'left') {
          // The left insert should go first.
          if (typeof peek() === 'string') {
            append(take(-1));
          }
        }

        // Otherwise skip the inserted text.
        append(component.length);
        break;

      case 'object': // Delete
        length = component.d;
        while (length > 0) {
          chunk = take(length, 'i');
          switch (typeof chunk) {
            case 'number':
              length -= chunk;
              break;
            case 'string':
              append(chunk);
              break;
            case 'object':
              // The delete is unnecessary now - the text has already been deleted.
              length -= chunk.d;
          }
        }
        break;
    }
  }

  // Append any extra data in op1.
  while ((component = take(-1)))
    append(component);

  return trim(newOp);
};

/** Compose op1 and op2 together and return the result */
exports.compose = function(op1, op2) {
  checkOp(op1);
  checkOp(op2);

  var result = [];
  var append = makeAppend(result);
  var take = makeTake(op1)[0];

  for (var i = 0; i < op2.length; i++) {
    var component = op2[i];
    var length, chunk;
    switch (typeof component) {
      case 'number': // Skip
        length = component;
        while (length > 0) {
          chunk = take(length, 'd');
          append(chunk);
          if (typeof chunk !== 'object') {
            length -= componentLength(chunk);
          }
        }
        break;

      case 'string': // Insert
        append(component);
        break;

      case 'object': // Delete
        length = component.d;

        while (length > 0) {
          chunk = take(length, 'd');

          switch (typeof chunk) {
            case 'number':
              append({d: chunk});
              length -= chunk;
              break;
            case 'string':
              length -= chunk.length;
              break;
            case 'object':
              append(chunk);
          }
        }
        break;
    }
  }

  while ((component = take(-1)))
    append(component);

  return trim(result);
};

// Calculate the cursor position after the given operation
function applyToCursor(op) {
  var pos = 0;
  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    switch (typeof c) {
    case 'number':
      pos += c;
      break;
    case 'string':
      pos += c.length;
      break;
    case 'object':
      //pos -= c.d;
      break;
    }
  }
  return pos;
};


// Generate an operation that semantically inverts the given operation
// when applied to the provided snapshot.
// It needs a snapshot of the document before the operation
// was applied to invert delete operations.
exports.semanticInvert = function (str, op) {
    if (typeof str !== 'string') {
        throw Error('Snapshot should be a string');
    }
    checkOp(op);

    // Save copy
    var originalOp = op.slice();

    // Shallow copy
    op = op.slice();

    var len = op.length;
    var cursor, prevOps, tmpStr;
    for (var i = 0; i < len; i++) {
        var c = op[i];
        switch (typeof c) {
        case 'number':
            // In case we have cursor movement we do nothing
            break;
        case 'string':
            // In case we have string insertion we generate a string deletion
            op[i] = {d: c.length};
            break;
        case 'object':
          // In case of a deletion we need to reinsert the deleted string
            prevOps = originalOp.slice(0, i);
            cursor = applyToCursor(prevOps);
            tmpStr = exports.apply(str, trim(prevOps));
            op[i] = tmpStr.substring(cursor, cursor + c.d);
            break;
        }
    }

    return exports.normalize(op);
};




var transformPosition = function(cursor, op) {
  var pos = 0;
  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (cursor <= pos) break;

    // I could actually use the op_iter stuff above - but I think its simpler
    // like this.
    switch (typeof c) {
      case 'number':
        if (cursor <= pos + c)
          return cursor;
        pos += c;
        break;

      case 'string':
        pos += c.length;
        cursor += c.length;
        break;

      case 'object':
        cursor -= Math.min(c.d, cursor - pos);
        break;
    }
  }
  return cursor;
};

exports.transformSelection = function(selection, op, isOwnOp) {
  var pos = 0;
  if (isOwnOp) {
    // Just track the position. We'll teleport the cursor to the end anyway.
    // This works because text ops don't have any trailing skips at the end - so the last
    // component is the last thing.
    for (var i = 0; i < op.length; i++) {
      var c = op[i];
      switch (typeof c) {
        case 'number':
          pos += c;
          break;
        case 'string':
          pos += c.length;
          break;
        // Just eat deletes.
      }
    }
    return pos;
  } else {
    return typeof selection === 'number' ?
      transformPosition(selection, op) : [transformPosition(selection[0], op), transformPosition(selection[1], op)];
  }
};

exports.selectionEq = function(c1, c2) {
  if (c1[0] != null && c1[0] === c1[1]) c1 = c1[0];
  if (c2[0] != null && c2[0] === c2[1]) c2 = c2[0];
  return c1 === c2 || (c1[0] != null && c2[0] != null && c1[0] === c2[0] && c1[1] == c2[1]);
};


},{}]},{},[4])(4)
});