(function(){
(function(){var r={exports:{}},e=r.exports;e.name="text",e.uri="http://sharejs.org/types/textv1",e.create=function(r){if(null!=r&&"string"!=typeof r)throw Error("Initial data must be a string");return r||""};var t=Array.isArray||function(r){return"[object Array]"===Object.prototype.toString.call(r)},n=function(r){if(!t(r))throw Error("Op must be an array of components");for(var e=null,n=0;r.length>n;n++){var o=r[n];switch(typeof o){case"object":if(!("number"==typeof o.d&&o.d>0))throw Error("Object components must be deletes of size > 0");break;case"string":if(!(o.length>0))throw Error("Inserts cannot be empty");break;case"number":if(!(o>0))throw Error("Skip components must be >0");if("number"==typeof e)throw Error("Adjacent skip components should be combined")}e=o}if("number"==typeof e)throw Error("Op has a trailing skip")},o=function(r){return function(e){return e&&0!==e.d?0===r.length?r.push(e):typeof e==typeof r[r.length-1]?"object"==typeof e?r[r.length-1].d+=e.d:r[r.length-1]+=e:r.push(e):void 0}},s=function(r){var e=0,t=0,n=function(n,o){if(e===r.length)return-1===n?null:n;var s,i=r[e];return"number"==typeof i?-1===n||n>=i-t?(s=i-t,++e,t=0,s):(t+=n,n):"string"==typeof i?-1===n||"i"===o||n>=i.length-t?(s=i.slice(t),++e,t=0,s):(s=i.slice(t,t+n),t+=n,s):-1===n||"d"===o||n>=i.d-t?(s={d:i.d-t},++e,t=0,s):(t+=n,{d:n})},o=function(){return r[e]};return[n,o]},i=function(r){return"number"==typeof r?r:r.length||r.d},a=function(r){return r.length>0&&"number"==typeof r[r.length-1]&&r.pop(),r};e.normalize=function(r){for(var e=[],t=o(e),n=0;r.length>n;n++)t(r[n]);return a(e)},e.apply=function(r,e){if("string"!=typeof r)throw Error("Snapshot should be a string");n(e);for(var t=[],o=0;e.length>o;o++){var s=e[o];switch(typeof s){case"number":if(s>r.length)throw Error("The op is too long for this document");t.push(r.slice(0,s)),r=r.slice(s);break;case"string":t.push(s);break;case"object":r=r.slice(s.d)}}return t.join("")+r},e.transform=function(r,e,t){if("left"!=t&&"right"!=t)throw Error("side ("+t+") must be 'left' or 'right'");n(r),n(e);for(var c=[],f=o(c),u=s(r),l=u[0],h=u[1],p=0;e.length>p;p++){var b,g,m=e[p];switch(typeof m){case"number":for(b=m;b>0;)g=l(b,"i"),f(g),"string"!=typeof g&&(b-=i(g));break;case"string":"left"===t&&"string"==typeof h()&&f(l(-1)),f(m.length);break;case"object":for(b=m.d;b>0;)switch(g=l(b,"i"),typeof g){case"number":b-=g;break;case"string":f(g);break;case"object":b-=g.d}}}for(;m=l(-1);)f(m);return a(c)},e.compose=function(r,e){n(r),n(e);for(var t=[],c=o(t),f=s(r)[0],u=0;e.length>u;u++){var l,h,p=e[u];switch(typeof p){case"number":for(l=p;l>0;)h=f(l,"d"),c(h),"object"!=typeof h&&(l-=i(h));break;case"string":c(p);break;case"object":for(l=p.d;l>0;)switch(h=f(l,"d"),typeof h){case"number":c({d:h}),l-=h;break;case"string":l-=h.length;break;case"object":c(h)}}}for(;p=f(-1);)c(p);return a(t)};var c=function(r,e){for(var t=0,n=0;e.length>n;n++){var o=e[n];if(t>=r)break;switch(typeof o){case"number":if(t+o>=r)return r;t+=o;break;case"string":t+=o.length,r+=o.length;break;case"object":r-=Math.min(o.d,r-t)}}return r};e.transformSelection=function(r,e,t){var n=0;if(t){for(var o=0;e.length>o;o++){var s=e[o];switch(typeof s){case"number":n+=s;break;case"string":n+=s.length}}return n}return"number"==typeof r?c(r,e):[c(r[0],e),c(r[1],e)]},e.transformCursor=e.transformSelection,e.selectionEq=function(r,e){return null!=r[0]&&r[0]===r[1]&&(r=r[0]),null!=e[0]&&e[0]===e[1]&&(e=e[0]),r===e||null!=r[0]&&null!=e[0]&&r[0]===e[0]&&r[1]==e[1]};var f=window.ottypes=window.ottypes||{},u=r.exports;f[u.name]=u,u.uri&&(f[u.uri]=u)})();// Text document API for the 'text' type.

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

var _types = (typeof require !== 'undefined') ?
  require('ottypes') : window.ottypes;

_types['http://sharejs.org/types/textv1'].api = {
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
(function(){function e(e){e.t="text0";var n={p:e.p.pop()};null!=e.si&&(n.i=e.si),null!=e.sd&&(n.d=e.sd),e.o=[n]}function n(e){e.p.push(e.o[0].p),null!=e.o[0].i&&(e.si=e.o[0].i),null!=e.o[0].d&&(e.sd=e.o[0].d),delete e.t,delete e.o}var i={exports:{}},t=i.exports;t._bootstrapTransform=function(e,n,i,t){var r=function(e,i,t,r){n(t,e,i,"left"),n(r,i,e,"right")},l=e.transformX=function(e,n){i(e),i(n);for(var o=[],p=0;n.length>p;p++){for(var d=n[p],f=[],s=0;e.length>s;){var a=[];if(r(e[s],d,f,a),s++,1!==a.length){if(0===a.length){for(var u=s;e.length>u;u++)t(f,e[u]);d=null;break}for(var v=l(e.slice(s),a),h=0;v[0].length>h;h++)t(f,v[0][h]);for(var c=0;v[1].length>c;c++)t(o,v[1][c]);d=null;break}d=a[0]}null!=d&&t(o,d),e=f}return[e,o]};e.transform=e.transform=function(e,i,t){if("left"!==t&&"right"!==t)throw Error("type must be 'left' or 'right'");return 0===i.length?e:1===e.length&&1===i.length?n([],e[0],i[0],t):"left"===t?l(e,i)[0]:l(i,e)[1]}};var r=i.exports={name:"text0",uri:"http://sharejs.org/types/textv0",create:function(e){if(null!=e&&"string"!=typeof e)throw Error("Initial data must be a string");return e||""}},l=function(e,n,i){return e.slice(0,n)+i+e.slice(n)},o=function(e){if("number"!=typeof e.p)throw Error("component missing position field");if("string"==typeof e.i==("string"==typeof e.d))throw Error("component needs an i or d field");if(0>e.p)throw Error("position cannot be negative")},p=function(e){for(var n=0;e.length>n;n++)o(e[n])};r.apply=function(e,n){var i;p(n);for(var t=0;n.length>t;t++){var r=n[t];if(null!=r.i)e=l(e,r.p,r.i);else{if(i=e.slice(r.p,r.p+r.d.length),r.d!==i)throw Error("Delete component '"+r.d+"' does not match deleted text '"+i+"'");e=e.slice(0,r.p)+e.slice(r.p+r.d.length)}}return e};var d=r._append=function(e,n){if(""!==n.i&&""!==n.d)if(0===e.length)e.push(n);else{var i=e[e.length-1];null!=i.i&&null!=n.i&&i.p<=n.p&&n.p<=i.p+i.i.length?e[e.length-1]={i:l(i.i,n.p-i.p,n.i),p:i.p}:null!=i.d&&null!=n.d&&n.p<=i.p&&i.p<=n.p+n.d.length?e[e.length-1]={d:l(n.d,i.p-n.p,i.d),p:n.p}:e.push(n)}};r.compose=function(e,n){p(e),p(n);for(var i=e.slice(),t=0;n.length>t;t++)d(i,n[t]);return i},r.normalize=function(e){var n=[];(null!=e.i||null!=e.p)&&(e=[e]);for(var i=0;e.length>i;i++){var t=e[i];null==t.p&&(t.p=0),d(n,t)}return n};var f=function(e,n,i){return null!=n.i?e>n.p||n.p===e&&i?e+n.i.length:e:n.p>=e?e:n.p+n.d.length>=e?n.p:e-n.d.length};r.transformCursor=function(e,n,i){for(var t="right"===i,r=0;n.length>r;r++)e=f(e,n[r],t);return e};var s=r._tc=function(e,n,i,t){if(o(n),o(i),null!=n.i)d(e,{i:n.i,p:f(n.p,i,"right"===t)});else if(null!=i.i){var r=n.d;n.p<i.p&&(d(e,{d:r.slice(0,i.p-n.p),p:n.p}),r=r.slice(i.p-n.p)),""!==r&&d(e,{d:r,p:n.p+i.i.length})}else if(n.p>=i.p+i.d.length)d(e,{d:n.d,p:n.p-i.d.length});else if(n.p+n.d.length<=i.p)d(e,n);else{var l={d:"",p:n.p};n.p<i.p&&(l.d=n.d.slice(0,i.p-n.p)),n.p+n.d.length>i.p+i.d.length&&(l.d+=n.d.slice(i.p+i.d.length-n.p));var p=Math.max(n.p,i.p),s=Math.min(n.p+n.d.length,i.p+i.d.length),a=n.d.slice(p-n.p,s-n.p),u=i.d.slice(p-i.p,s-i.p);if(a!==u)throw Error("Delete ops delete different text in the same region of the document");""!==l.d&&(l.p=f(l.p,i),d(e,l))}return e},a=function(e){return null!=e.i?{d:e.i,p:e.p}:{i:e.d,p:e.p}};r.invert=function(e){e=e.slice().reverse();for(var n=0;e.length>n;n++)e[n]=a(e[n]);return e},t._bootstrapTransform?t._bootstrapTransform(r,s,p,d):require("./helpers")._bootstrapTransform(r,s,p,d);var u=function(e){return"[object Array]"==Object.prototype.toString.call(e)},v=function(e){return JSON.parse(JSON.stringify(e))},h={name:"json0",uri:"http://sharejs.org/types/JSONv0"},c={};h.registerSubtype=function(e){c[e.name]=e},h.create=function(e){return void 0===e?null:v(e)},h.invertComponent=function(e){var n={p:e.p};return e.t&&c[e.t]&&(n.t=e.t,n.o=c[e.t].invert(e.o)),void 0!==e.si&&(n.sd=e.si),void 0!==e.sd&&(n.si=e.sd),void 0!==e.oi&&(n.od=e.oi),void 0!==e.od&&(n.oi=e.od),void 0!==e.li&&(n.ld=e.li),void 0!==e.ld&&(n.li=e.ld),void 0!==e.na&&(n.na=-e.na),void 0!==e.lm&&(n.lm=e.p[e.p.length-1],n.p=e.p.slice(0,e.p.length-1).concat([e.lm])),n},h.invert=function(e){for(var n=e.slice().reverse(),i=[],t=0;n.length>t;t++)i.push(h.invertComponent(n[t]));return i},h.checkValidOp=function(e){for(var n=0;e.length>n;n++)if(!u(e[n].p))throw Error("Missing path")},h.checkList=function(e){if(!u(e))throw Error("Referenced element not a list")},h.checkObj=function(e){if(e.constructor!==Object)throw Error("Referenced element not an object (it was "+JSON.stringify(e)+")")},h.apply=function(n,i){h.checkValidOp(i),i=v(i);for(var t={data:n},r=0;i.length>r;r++){var l=i[r];(null!=l.si||null!=l.sd)&&e(l);for(var o=null,p=null,d=t,f="data",s=0;l.p.length>s;s++){var a=l.p[s];if(o=d,p=f,d=d[f],f=a,null==o)throw Error("Path invalid")}if(l.t&&void 0!==l.o&&c[l.t])d[f]=c[l.t].apply(d[f],l.o);else if(void 0!==l.na){if("number"!=typeof d[f])throw Error("Referenced element not a number");d[f]+=l.na}else if(void 0!==l.li&&void 0!==l.ld)h.checkList(d),d[f]=l.li;else if(void 0!==l.li)h.checkList(d),d.splice(f,0,l.li);else if(void 0!==l.ld)h.checkList(d),d.splice(f,1);else if(void 0!==l.lm){if(h.checkList(d),l.lm!=f){var u=d[f];d.splice(f,1),d.splice(l.lm,0,u)}}else if(void 0!==l.oi)h.checkObj(d),d[f]=l.oi;else{if(void 0===l.od)throw Error("invalid / missing instruction in op");h.checkObj(d),delete d[f]}}return t.data},h.shatter=function(e){for(var n=[],i=0;e.length>i;i++)n.push([e[i]]);return n},h.incrementalApply=function(e,n,i){for(var t=0;n.length>t;t++){var r=[n[t]];e=h.apply(e,r),i(r,e)}return e};var g=h.pathMatches=function(e,n,i){if(e.length!=n.length)return!1;for(var t=0;e.length>t;t++)if(e[t]!==n[t]&&(!i||t!==e.length-1))return!1;return!0};if(h.append=function(i,t){if(t=v(t),0===i.length)return i.push(t),void 0;var r=i[i.length-1];if(null==t.si&&null==t.sd||null==r.si&&null==r.sd||(e(t),e(r)),g(t.p,r.p))if(t.t&&r.t&&t.t===r.t&&c[t.t]){if(r.o=c[t.t].compose(r.o,t.o),null!=t.si||null!=t.sd){for(var l=t.p,o=0;r.o.length-1>o;o++)t.o=[r.o.pop()],t.p=l.slice(),n(t),i.push(t);n(r)}}else null!=r.na&&null!=t.na?i[i.length-1]={p:r.p,na:r.na+t.na}:void 0!==r.li&&void 0===t.li&&t.ld===r.li?void 0!==r.ld?delete r.li:i.pop():void 0!==r.od&&void 0===r.oi&&void 0!==t.oi&&void 0===t.od?r.oi=t.oi:void 0!==r.oi&&void 0!==t.od?void 0!==t.oi?r.oi=t.oi:void 0!==r.od?delete r.oi:i.pop():void 0!==t.lm&&t.p[t.p.length-1]===t.lm||i.push(t);else null==t.si&&null==t.sd||null==r.si&&null==r.sd||(n(t),n(r)),i.push(t)},h.compose=function(e,n){h.checkValidOp(e),h.checkValidOp(n);for(var i=v(e),t=0;n.length>t;t++)h.append(i,n[t]);return i},h.normalize=function(e){var n=[];e=u(e)?e:[e];for(var i=0;e.length>i;i++){var t=e[i];null==t.p&&(t.p=[]),h.append(n,t)}return n},h.commonLengthForOps=function(e,n){var i=e.p.length,t=n.p.length;if((null!=e.na||e.t)&&i++,(null!=n.na||n.t)&&t++,0===i)return-1;if(0===t)return null;i--,t--;for(var r=0;i>r;r++){var l=e.p[r];if(r>=t||l!==n.p[r])return null}return i},h.canOpAffectPath=function(e,n){return null!=h.commonLengthForOps({p:n},e)},h.transformComponent=function(i,t,r,l){t=v(t);var o=h.commonLengthForOps(r,t),p=h.commonLengthForOps(t,r),d=t.p.length,f=r.p.length;if((null!=t.na||t.t)&&d++,(null!=r.na||r.t)&&f++,null!=p&&f>d&&t.p[p]==r.p[p])if(void 0!==t.ld){var s=v(r);s.p=s.p.slice(d),t.ld=h.apply(v(t.ld),[s])}else if(void 0!==t.od){var s=v(r);s.p=s.p.slice(d),t.od=h.apply(v(t.od),[s])}if(null!=o){var a=d==f,s=r;if(null==t.si&&null==t.sd||null==r.si&&null==r.sd||(e(t),s=v(r),e(s)),s.t&&c[s.t]){if(t.t&&t.t===s.t){var u=c[t.t].transform(t.o,s.o,l);if(u.length>0)if(null!=t.si||null!=t.sd)for(var g=t.p,m=0;u.length>m;m++)t.o=[u[m]],t.p=g.slice(),n(t),h.append(i,t);else t.o=u,h.append(i,t);return i}}else if(void 0!==r.na);else if(void 0!==r.li&&void 0!==r.ld){if(r.p[o]===t.p[o]){if(!a)return i;if(void 0!==t.ld){if(void 0===t.li||"left"!==l)return i;t.ld=v(r.li)}}}else if(void 0!==r.li)void 0!==t.li&&void 0===t.ld&&a&&t.p[o]===r.p[o]?"right"===l&&t.p[o]++:r.p[o]<=t.p[o]&&t.p[o]++,void 0!==t.lm&&a&&r.p[o]<=t.lm&&t.lm++;else if(void 0!==r.ld){if(void 0!==t.lm&&a){if(r.p[o]===t.p[o])return i;var g=r.p[o],y=t.p[o],b=t.lm;(b>g||g===b&&b>y)&&t.lm--}if(r.p[o]<t.p[o])t.p[o]--;else if(r.p[o]===t.p[o]){if(d>f)return i;if(void 0!==t.ld){if(void 0===t.li)return i;delete t.ld}}}else if(void 0!==r.lm)if(void 0!==t.lm&&d===f){var y=t.p[o],b=t.lm,w=r.p[o],O=r.lm;if(w!==O)if(y===w){if("left"!==l)return i;t.p[o]=O,y===b&&(t.lm=O)}else y>w&&t.p[o]--,y>O?t.p[o]++:y===O&&w>O&&(t.p[o]++,y===b&&t.lm++),b>w?t.lm--:b===w&&b>y&&t.lm--,b>O?t.lm++:b===O&&(O>w&&b>y||w>O&&y>b?"right"===l&&t.lm++:b>y?t.lm++:b===w&&t.lm--)}else if(void 0!==t.li&&void 0===t.ld&&a){var y=r.p[o],b=r.lm;g=t.p[o],g>y&&t.p[o]--,g>b&&t.p[o]++}else{var y=r.p[o],b=r.lm;g=t.p[o],g===y?t.p[o]=b:(g>y&&t.p[o]--,g>b?t.p[o]++:g===b&&y>b&&t.p[o]++)}else if(void 0!==r.oi&&void 0!==r.od){if(t.p[o]===r.p[o]){if(void 0===t.oi||!a)return i;if("right"===l)return i;t.od=r.oi}}else if(void 0!==r.oi){if(void 0!==t.oi&&t.p[o]===r.p[o]){if("left"!==l)return i;h.append(i,{p:t.p,od:r.oi})}}else if(void 0!==r.od&&t.p[o]==r.p[o]){if(!a)return i;if(void 0===t.oi)return i;delete t.od}}return h.append(i,t),i},t._bootstrapTransform?t._bootstrapTransform(h,h.transformComponent,h.checkValidOp,h.append):require("./helpers")._bootstrapTransform(h,h.transformComponent,h.checkValidOp,h.append),r===void 0)var r="undefined"!=typeof require?require("./text0"):window.ottypes.text;h.registerSubtype(r),i.exports=h;var m=window.ottypes=window.ottypes||{},y=i.exports;m[y.name]=y,y.uri&&(m[y.uri]=y)})();// JSON document API for the 'json0' type.

(function() {
  var __slice = [].slice;
  var _types = typeof require !== 'undefined' ? require('ottypes') : window.ottypes;
  var _type = _types['http://sharejs.org/types/JSONv0'];

  // Helpers

  function depath(path) {
    if (path.length === 1 && path[0].constructor === Array) {
      return path[0];
    } else {
      return path;
    }
  }

  function traverse(snapshot, path) {
    var key = 'data';
    var elem = { data: snapshot };

    for (var i = 0; i < path.length; i++) {
      elem = elem[key];
      key = path[i];
      if (typeof elem === 'undefined') {
        throw new Error('bad path');
      }
    }

    return {
      elem: elem,
      key: key
    };
  }

  function pathEquals(p1, p2) {
    if (p1.length !== p2.length) {
      return false;
    }
    for (var i = 0; i < p1.length; ++i) {
      if (p1[i] !== p2[i]) {
        return false;
      }
    }
    return true;
  }

  function containsPath(p1, p2) {
    if (p1.length < p2.length) return false;
    return pathEquals( p1.slice(0,p2.length), p2);
  }

  // does nothing, used as a default callback
  function nullFunction() {}

  // given a path represented as an array or a number, normalize to an array
  // whole numbers are converted to integers.
  function normalizePath(path) {
    if (path instanceof Array) {
      return path;
    }
    if (typeof(path) == "number") {
      return [path];
    }
    // if (typeof(path) == "string") {
    //   path = path.split(".");
    //   var out = [];
    //   for (var i=0; i<path.length; i++) {
    //     var part = path[i];
    //     if (String(parseInt(part, 10)) == part) {
    //       out.push(parseInt(part, 10));
    //     } else {
    //       out.push(part);
    //     }
    //   }
    //   return out;
    // }
  }

  // helper for creating functions with the method signature func([path],arg1,arg2,...,[cb])
  // populates an array of arguments with a default path and callback
  function normalizeArgs(obj, args, func, requiredArgsCount){
    args = Array.prototype.slice.call(args);
    var path_prefix = obj.path || [];

    if (func.length > 1 && typeof args[args.length-1] !== 'function') {
      args.push(nullFunction);
    }

    if (args.length < (requiredArgsCount || func.length)) {
      args.unshift(path_prefix);
    } else {
      args[0] = path_prefix.concat(normalizePath(args[0]));
    }

    return func.apply(obj,args);
  }


  // SubDoc
  // this object is returned from context.createContextAt()

  var SubDoc = function(context, path) {
    this.context = context;
    this.path = path || [];
  };

  SubDoc.prototype._updatePath = function(op){
    console.log("UPDATEPATH", op);
    for (var i = 0; i < op.length; i++) {
      var c = op[i];
      if(c.lm !== undefined && containsPath(this.path,c.p)){
        var new_path_prefix = c.p.slice(0,c.p.length-1);
        new_path_prefix.push(c.lm);
        this.path = new_path_prefix.concat(this.path.slice(new_path_prefix.length));
      }
    }
  };

  SubDoc.prototype.createContextAt = function() {
    var path = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return this.context.createContextAt(this.path.concat(depath(path)));
  };

  SubDoc.prototype.get = function(path) {
    return normalizeArgs(this, arguments, function(path){
      return this.context.get(path);
    });
  };

  SubDoc.prototype.set = function(path, value, cb) {
    return normalizeArgs(this, arguments, function(path, value, cb){
      return this.context.set(path, value, cb);
    });
  };

  SubDoc.prototype.insert = function(path, value, cb) {
    return normalizeArgs(this, arguments, function(path, value, cb){
      return this.context.insert(path, value, cb);
    });
  };

  SubDoc.prototype.remove = function(path, len, cb) {
    return normalizeArgs(this, arguments, function(path, len, cb) {
      return this.context.remove(path, len, cb);
    }, 2);
  };

  SubDoc.prototype.push = function(path, value, cb) {
    return normalizeArgs(this, arguments, function(path, value, cb) {
        var _ref = traverse(this.context.getSnapshot(), path);
        var len = _ref.elem[_ref.key].length;
        path.push(len);
      return this.context.insert(path, value, cb);
    });
  };

  SubDoc.prototype.move = function(path, from, to, cb) {
    return normalizeArgs(this, arguments, function(path, from, to, cb) {
      console.log("sd MOVE");
      return this.context.move(path, from, to, cb);
    });
  };

  SubDoc.prototype.add = function(path, amount, cb) {
    return normalizeArgs(this, arguments, function(path, amount, cb) {
      return this.context.add(path, amount, cb);
    });
  };

  SubDoc.prototype.on = function(event, cb) {
    return this.context.addListener(this.path, event, cb);
  };

  SubDoc.prototype.removeListener = function(l) {
    return this.context.removeListener(l);
  };

  SubDoc.prototype.getLength = function(path) {
    return normalizeArgs(this, arguments, function(path) {
      return this.context.getLength(path);
    });
  };

  // DEPRECATED
  SubDoc.prototype.getText = function(path) {
    return normalizeArgs(this, arguments, function(path) {
      return this.context.getText(path);
    });
  };

  // DEPRECATED
  SubDoc.prototype.deleteText = function(path, pos, length, cb) {
    return normalizeArgs(this, arguments, function(path, pos, length, cb) {
      return this.context.deleteText(path, length, pos, cb);
    });
  };

  SubDoc.prototype.destroy = function() {
    this.context._removeSubDoc(this);
  };


  // JSON API methods
  // these methods are mixed in to the context return from doc.createContext()

  _type.api = {

    provides: {
      json: true
    },

    _fixComponentPaths: function(c) {
      if (!this._listeners) {
        return;
      }
      if (c.na !== undefined || c.si !== undefined || c.sd !== undefined) {
        return;
      }

      var to_remove = [];
      var _ref = this._listeners;

      for (var i = 0; i < _ref.length; i++) {
        var l = _ref[i];
        var dummy = {
          p: l.path,
          na: 0
        };
        var xformed = _type.transformComponent([], dummy, c, 'left');
        if (xformed.length === 0) {
          to_remove.push(i);
        } else if (xformed.length === 1) {
          l.path = xformed[0].p;
        } else {
          throw new Error("Bad assumption in json-api: xforming an 'na' op will always result in 0 or 1 components.");
        }
      }

      to_remove.sort(function(a, b) {
        return b - a;
      });

      var _results = [];
      for (var j = 0; j < to_remove.length; j++) {
        i = to_remove[j];
        _results.push(this._listeners.splice(i, 1));
      }

      return _results;
    },

    _fixPaths: function(op) {
      var _results = [];
      for (var i = 0; i < op.length; i++) {
        var c = op[i];
        _results.push(this._fixComponentPaths(c));
      }
      return _results;
    },

    _submit: function(op, callback) {
      this._fixPaths(op);
      return this.submitOp(op, callback);
    },

    _addSubDoc: function(subdoc){
      this._subdocs || (this._subdocs = []);
      this._subdocs.push(subdoc);
    },

    _removeSubDoc: function(subdoc){
      this._subdocs || (this._subdocs = []);
      for(var i = 0; i < this._subdocs.length; i++){
        if(this._subdocs[i] === subdoc) this._subdocs.splice(i,1);
        return;
      }
    },

    _updateSubdocPaths: function(op){
      this._subdocs || (this._subdocs = []);
      for(var i = 0; i < this._subdocs.length; i++){
        this._subdocs[i]._updatePath(op);
      }
    },

    createContextAt: function() {
      var path = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      var subdoc =  new SubDoc(this, depath(path));
      this._addSubDoc(subdoc);
      return subdoc;
    },

    get: function(path) {
      if (!path) return this.getSnapshot();
      return normalizeArgs(this,arguments,function(path){
        var _ref = traverse(this.getSnapshot(), path);
        return _ref.elem[_ref.key];
      });
    },

    set: function(path, value, cb) {
      return normalizeArgs(this, arguments, function(path, value, cb) {
        var _ref = traverse(this.getSnapshot(), path);
        var elem = _ref.elem;
        var key = _ref.key;
        var op = {
          p: path
        };

        if (elem.constructor === Array) {
          op.li = value;
          if (typeof elem[key] !== 'undefined') {
            op.ld = elem[key];
          }
        } else if (typeof elem === 'object') {
          op.oi = value;
          if (typeof elem[key] !== 'undefined') {
            op.od = elem[key];
          }
        } else {
          throw new Error('bad path');
        }

        return this._submit([op], cb);
      });
    },

    remove: function(path, len, cb) {
      return normalizeArgs(this, arguments, function(path, len, cb) {
        if (!cb && len instanceof Function) {
          cb = len;
          len = null;
        }
        // if there is no len argument, then we are removing a single item from either a list or a hash
        var _ref, elem, op, key;
        if (len === null || len === undefined) {
          _ref = traverse(this.getSnapshot(), path);
          elem = _ref.elem;
          key = _ref.key;
          op = {
            p: path
          };

          if (typeof elem[key] === 'undefined') {
            throw new Error('no element at that path');
          }

          if (elem.constructor === Array) {
            op.ld = elem[key];
          } else if (typeof elem === 'object') {
            op.od = elem[key];
          } else {
            throw new Error('bad path');
          }
          return this._submit([op], cb);
        } else {
          var pos;
          pos = path.pop();
          _ref = traverse(this.getSnapshot(), path);
          elem = _ref.elem;
          key = _ref.key;
          if (typeof elem[key] === 'string') {
            op = {
              p: path.concat(pos),
              sd: _ref.elem[_ref.key].slice(pos, pos + len)
            };
            return this._submit([op], cb);
          } else if (elem[key].constructor === Array) {
            var ops = [];
            for (var i=pos; i<pos+len; i++) {
              ops.push({
                p: path.concat(pos),
                ld: elem[key][i]
              });
            }
            return this._submit(ops, cb);
          } else {
            throw new Error('element at path does not support range');
          }
        }
      }, 2);
    },

    insert: function(path, value, cb) {
      return normalizeArgs(this, arguments, function(path, value, cb) {
        var pos = path.pop();
        var _ref = traverse(this.getSnapshot(), path);
        var elem = _ref.elem;
        var key = _ref.key;
        var op = {
          p: path.concat(pos)
        };

        if (elem[key].constructor === Array) {
          op.li = value;
        } else if (typeof elem[key] === 'string') {
          op.si = value;
        }
        return this._submit([op], cb);
      });
    },

    move: function(path, from, to, cb) {
      return normalizeArgs(this, arguments, function(path, from, to, cb) {
        var self = this;
        var op = [
          {
            p: path.concat(from),
            lm: to
          }
        ];

        return this._submit(op, function(){
          self._updateSubdocPaths(op);
          if(cb) cb.apply(cb, arguments);
        });
      });
    },

    push: function(path, value, cb) {
      return normalizeArgs(this, arguments, function(path, value, cb) {
        var _ref = traverse(this.getSnapshot(), path);
        var len = _ref.elem[_ref.key].length;
        path.push(len);
        return this.insert(path, value, cb);
      });
    },

    add: function(path, amount, cb) {
      return normalizeArgs(this, arguments, function(path, value, cb) {
        var op = [
          {
            p: path,
            na: amount
          }
        ];
        return this._submit(op, cb);
      });
    },

    getLength: function(path) {
        return normalizeArgs(this, arguments, function(path) {
          return this.get(path).length;
        });
    },

    getText: function(path) {
      return normalizeArgs(this, arguments, function(path) {
        console.warn("Deprecated. Use `get()` instead");
        return this.get(path);
      });
    },

    deleteText: function(path, length, pos, cb) {
      return normalizeArgs(this, arguments, function(path, length, pos, cb) {
        console.warn("Deprecated. Use `remove(path, length, cb)` instead");
        var _ref = traverse(this.getSnapshot(), path);
        var op = [
          {
            p: path.concat(pos),
            sd: _ref.elem[_ref.key].slice(pos, pos + length)
          }
        ];

        return this._submit(op, cb);
      });
    },

    addListener: function(path, event, cb) {
      return normalizeArgs(this, arguments, function(path, value, cb) {
        var listener = {
          path: path,
          event: event,
          cb: cb
        };
        this._listeners || (this._listeners = []);
        this._listeners.push(listener);
        return listener;
      });
    },

    removeListener: function(listener) {
      if (!this._listeners) {
        return;
      }
      var i = this._listeners.indexOf(listener);
      if (i < 0) {
        return false;
      }
      this._listeners.splice(i, 1);
      return true;
    },

    _onOp: function(op) {
      for (var i = 0; i < op.length; i++) {
        var c = op[i];
        this._fixComponentPaths(c);

        if(c.lm !== undefined) {
          this._updateSubdocPaths([c]);
        }

        var match_path = c.na === undefined ? c.p.slice(0, c.p.length - 1) : c.p;

        for (var l = 0; l < this._listeners.length; l++) {
          var listener = this._listeners[l];
          var cb = listener.cb;

          if (pathEquals(listener.path, match_path)) {
            switch (listener.event) {
              case 'insert':
                if (c.li !== undefined && c.ld === undefined) {
                  cb(c.p[c.p.length - 1], c.li);
                } else if (c.oi !== undefined && c.od === undefined) {
                  cb(c.p[c.p.length - 1], c.oi);
                } else if (c.si !== undefined) {
                  cb(c.p[c.p.length - 1], c.si);
                }
                break;
              case 'delete':
                if (c.li === undefined && c.ld !== undefined) {
                  cb(c.p[c.p.length - 1], c.ld);
                } else if (c.oi === undefined && c.od !== undefined) {
                  cb(c.p[c.p.length - 1], c.od);
                } else if (c.sd !== undefined) {
                  cb(c.p[c.p.length - 1], c.sd);
                }
                break;
              case 'replace':
                if (c.li !== undefined && c.ld !== undefined) {
                  cb(c.p[c.p.length - 1], c.ld, c.li);
                } else if (c.oi !== undefined && c.od !== undefined) {
                  cb(c.p[c.p.length - 1], c.od, c.oi);
                }
                break;
              case 'move':
                if (c.lm !== undefined) {
                  cb(c.p[c.p.length - 1], c.lm);
                }
                break;
              case 'add':
                if (c.na !== undefined) {
                  cb(c.na);
                }
            }
          }

          if (_type.canOpAffectPath(c, listener.path) && listener.event === 'child op') {
            var child_path = c.p.slice(listener.path.length);
            cb(child_path, c);
          }
        }
      }
    }
  };

}).call(this);
// This file is included at the top of the compiled client JS.

// All the modules will just add stuff to exports, and it'll all get exported.
var exports = window.sharejs = {version: '0.7.0-alpha13'};

// This is a simple rewrite of microevent.js. I've changed the
// function names to be consistent with node.js EventEmitter.
//
// microevent.js is copyright Jerome Etienne, and licensed under the MIT license:
// https://github.com/jeromeetienne/microevent.js

var MicroEvent = function() {};

MicroEvent.prototype.on = function(event, fn) {
  var events = this._events = this._events || {};
  (events[event] = events[event] || []).push(fn);
};

MicroEvent.prototype.removeListener = function(event, fn) {
  var events = this._events = this._events || {};
  var listeners = events[event] = events[event] || [];

  // Sadly, no IE8 support for indexOf.
  var i = 0;
  while (i < listeners.length) {
    if (listeners[i] === fn) {
      listeners[i] = undefined;
    }
    i++;
  }

  // Compact the list when no event handler is actually running.
  setTimeout(function() {
    events[event] = [];
    var fn;
    for (var i = 0; i < listeners.length; i++) {
      // Only add back event handlers which exist.
      if ((fn = listeners[i])) events[event].push(fn);
    }
  }, 0);
};

MicroEvent.prototype.emit = function(event) {
  var events = this._events;
  var args = Array.prototype.splice.call(arguments, 1);

  if (!events || !events[event]) {
    if (event == 'error') {
      if (console) {
        console.error.apply(console, args);
      }
    }
    return;
  }

  var listeners = events[event];
  for (var i = 0; i < listeners.length; i++) {
    if (listeners[i]) {
      listeners[i].apply(this, args);
    }
  }
};

MicroEvent.prototype.once = function(event, fn) {
  var listener, _this = this;
  this.on(event, listener = function() {
    _this.removeListener(event, listener);
    fn.apply(_this, arguments);
  });
};

MicroEvent.mixin = function(obj) {
  var proto = obj.prototype || obj;
  proto.on = MicroEvent.prototype.on;
  proto.removeListener = MicroEvent.prototype.removeListener;
  proto.emit = MicroEvent.prototype.emit;
  proto.once = MicroEvent.prototype.once;
  return obj;
};

if (typeof module !== "undefined") module.exports = MicroEvent;

var types;
if (typeof require !== "undefined") {
  types = require('ottypes');
} else {
  types = window.ottypes;
}

exports.registerType = function(type) {
  if (type.name) types[type.name] = type;
  if (type.uri) types[type.uri] = type;
};var types;

if (typeof require !== "undefined") {
  types = require('ottypes');
  MicroEvent = require('./microevent');
} else {
  types = window.ottypes;
}

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
 * - `unsubscribed (error)` The document was unsubscribed
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

MicroEvent.mixin(Doc);

/**
 * Unsubscribe and remove all editing contexts
 */
Doc.prototype.destroy = function(callback) {
  var doc = this;
  this.unsubscribe(function() {
    // Don't care if there's an error unsubscribing.

    setTimeout(function() {
      // There'll probably be nothing here seeing as how we just unsubscribed.
      for (var i = 0; i < doc._subscribeCallbacks.length; i++) {
        doc._subscribeCallbacks[i]('Document destroyed');
      }
      doc._subscribeCallbacks.length = 0;
    }, 0);

    doc.connection._destroyDoc(doc);
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
    if (!types[newType]) throw new Error("Missing type " + newType);
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
  if (this.state) {
    if (typeof console !== "undefined") console.warn('Ignoring attempt to ingest data in state', this.state);
    return;
  }
  if (typeof data.v !== 'number') throw new Error('Missing version in ingested data');


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
    if (console) console.error("Could not subscribe: " + err);
    this.emit('error', err);
    // There's probably a reason we couldn't subscribe. Don't retry.
    this._setWantSubscribe(false, null, err)
  } else {
    if (data) this.ingestData(data);
    this.subscribed = true;
    this.emit('subscribe');
    this._finishSub(true);
  }

  this._clearAction('subscribe');
};

// This is called by the connection when it receives a message for the document.
Doc.prototype._onMessage = function(msg) {
  if (!(msg.c === this.collection && msg.d === this.name)) {
    // This should never happen - its a sanity check for bugs in the connection code.
    throw new Error("Got message for wrong document.");
  }

  // msg.a = the action.
  switch (msg.a) {
    case 'fetch':
      // We're done fetching. This message has no other information.
      if (msg.data) this.ingestData(msg.data);
      this._finishSub('fetch', msg.error);
      if (this.wantSubscribe === 'fetch') this.wantSubscribe = false;
      this._clearAction('fetch');
      break;

    case 'sub':
      // Subscribe reply.
      this._handleSubscribe(msg.error, msg.data);
      break;

    case 'unsub':
      // Unsubscribe reply
      this.subscribed = false;
      this.emit('unsubscribe');

      this._finishSub(false, msg.error);
      this._clearAction('unsubscribe');
      break;

    case 'ack':
      // Acknowledge a locally submitted operation.
      //
      // Usually we do nothing here - all the interesting logic happens when we
      // get sent our op back in the op stream (which happens even if we aren't
      // subscribed). However, if the op doesn't get accepted, we still need to
      // clear some state.
      //
      // If the message error is 'Op already submitted', that means we've
      // resent an op that the server already got. It will also be confirmed
      // normally.
      if (msg.error && msg.error !== 'Op already submitted') {
        // The server has rejected an op from the client for some reason.
        // We'll send the error message to the user and try to roll back the change.
        if (this.inflightData) {
          console.warn('Operation was rejected (' + msg.error + '). Trying to rollback change locally.');
          this._tryRollback(this.inflightData);
          this._clearInflightOp(msg.error);
        } else {
          // I managed to get into this state once. I'm not sure how it happened.
          // The op was maybe double-acknowledged?
          if (console) console.warn('Second acknowledgement message (error) received', msg, this);
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
      if (console) console.warn('Unhandled meta op:', msg);
      break;

    default:
      if (console) console.warn('Unhandled document message:', msg);
      break;
  }
};

// Called whenever (you guessed it!) the connection state changes. This will
// happen when we get disconnected & reconnect.
Doc.prototype._onConnectionStateChanged = function(state, reason) {
  if (state === 'connecting') {
    if (this.inflightData) {
      this._sendOpData();
    } else {
      this.flush();
    }
  } else if (state === 'connected') {
    // We go into the connected state once we have a sessionID. We can't send
    // new ops until then, so we need to flush again.
    this.flush();
  } else if (state === 'disconnected') {
    this.action = null;
    this.subscribed = false;
    if (this.subscribed) this.emit('unsubscribed');
  }
};




// ****** Dealing with actions

Doc.prototype._clearAction = function(expectedAction) {
  if (this.action !== expectedAction) {
    console.warn('Unexpected action ' + this.action + ' expected: ' + expectedAction);
  }
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

  if (!this.wantSubscribe !== !value) {
    // Call all the current subscribe/unsubscribe callbacks.
    for (var i = 0; i < this._subscribeCallbacks.length; i++) {
      // Should I return an error here? What happened is the user unsubcribed
      // with a callback then resubscribed straight after. Does that mean the
      // unsubscribe failed?
      this._subscribeCallbacks[i](err);
    }
    this._subscribeCallbacks.length = 0;
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
Doc.prototype._finishSub = function(value, error) {
  if (value === this.wantSubscribe) {
    for (var i = 0; i < this._subscribeCallbacks.length; i++) {
      this._subscribeCallbacks[i](error);
    }
    this._subscribeCallbacks.length = 0;
  }
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
  if (client.create) throw new Error('Invalid state. This is a bug.');

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
    //console.log('xf', JSON.stringify(client.op), JSON.stringify(server.op));
    var _c = client.type.transform(client.op, server.op, 'left');
    var _s = client.type.transform(server.op, client.op, 'right');
    client.op = _c; server.op = _s;
    //console.log('->', JSON.stringify(client.op), JSON.stringify(server.op));
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
    if (!this.type) throw new Error('Document does not exist');

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
      if (contexts.remove) contexts.splice(i--, 1);
    }

    return this.emit('after op', opData.op, context);
  }
};



// ***** Sending operations


// Actually send op data to the server.
Doc.prototype._sendOpData = function() {
  var d = this.inflightData;

  if (this.action) throw new Error('invalid state ' + this.action + ' for sendOpData');
  this.action = 'submit';

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
  //console.log('submit', JSON.stringify(opData), 'v=', this.version);

  if (typeof context === 'function') {
    callback = context;
    context = true; // The default context is true.
  }
  if (context == null) context = true;

  var error = function(err) {
    if (callback) callback(err);
    else if (console) console.warn('Failed attempt to submitOp:', err);
  };

  if (this.locked) {
    return error("Cannot call submitOp from inside an 'op' event handler");
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
  this._clearAction('submit');

  if (!this.pendingData.length) {
    // This isn't a very good name.
    this.emit('nothing pending');
  }
};

// This is called when the server acknowledges an operation from the client.
Doc.prototype._opAcknowledged = function(msg) {
  // Our inflight op has been acknowledged, so we can throw away the inflight data.
  // (We were only holding on to it incase we needed to resend the op.)
  if (!this.state) {
    throw new Error('opAcknowledged called from a null state. This should never happen.');
  } else if (this.state === 'floating') {
    if (!this.inflightData.create) throw new Error('Cannot acknowledge an op.');

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
    if (msg.v !== this.version)
      throw new Error('Invalid version from server. This can happen when you submit ops in a submitOp callback.');
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
  if (!type) throw new Error('Missing type');

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
      this.remove = true;
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
var Doc, Query;
if (typeof require !== 'undefined') {
  Doc = require('./doc').Doc;
  Query = require('./query').Query;
  MicroEvent = require('./microevent');
} else {
  Doc   = exports.Doc;
  Query = exports.Query
}


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
  this.state = 'disconnected'

  // This is a helper variable the document uses to see whether we're currently
  // in a 'live' state. It is true if we're connected, or if you're using
  // browserchannel and connecting.
  this.canSend = false

  // Reset some more state variables.
  this.reset();

  this.debug = false;

  // I'll store the most recent 100 messages so when errors occur we can see
  // what happened.
  this.messageBuffer = [];

  this.bindToSocket(socket);
}
MicroEvent.mixin(Connection);


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

      if (! result && msg.error) {
        this.emit('error', msg.error);
        break;
      }

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

      this.get(collection, docName)._onMessage(msg);
  }
};


Connection.prototype.reset = function() {
  this.id = this.lastError =
    this._lastReceivedCollection = this._lastReceivedDoc =
    this._lastSentCollection = this._lastSentDoc = null;

  this.seq = 1;
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

  if (newState === 'disconnected') this.reset();

  this.emit(newState, data);

  // & Emit the event to all documents & queries. It might make sense for
  // documents to just register for this stuff using events, but that couples
  // connections and documents a bit much. Its not a big deal either way.
  this.opQueue = [];
  this.bsStart();
  for (var c in this.collections) {
    var collection = this.collections[c];
    for (var docName in collection) {
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

  // Its important that query resubscribes are sent after documents to make sure
  // the server knows all the documents we're subscribed to when it issues the
  // queries internally.

  // No bulk subscribe for queries yet.
  for (var id in this.queries) {
    this.queries[id]._onConnectionStateChanged(newState, data);
  }
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
  // Only send bulk subscribe if not empty. Its weird using a for loop for
  // this, but it works pretty well.
  for (var __unused in this.subscribeData) {
    this.send({a:'bs', s:this.subscribeData});
    break;
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


/**
 * @deprecated
 */
Connection.prototype.getExisting = function(collection, name) {
  console.trace('getExisting is deprecated. Use get() instead');
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
/* This contains the textarea binding for ShareJS. This binding is really
 * simple, and a bit slow on big documents (Its O(N). However, it requires no
 * changes to the DOM and no heavy libraries like ace. It works for any kind of
 * text input field.
 *
 * You probably want to use this binding for small fields on forms and such.
 * For code editors or rich text editors or whatever, I recommend something
 * heavier.
 */


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
window.sharejs.Doc.prototype.attachTextarea = function(elem, ctx) {
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

var Doc;
if (typeof require !== 'undefined') {
  Doc = require('./doc').Doc;
}

// Queries are live requests to the database for particular sets of fields.
//
// The server actively tells the client when there's new data that matches
// a set of conditions.
var Query = exports.Query = function(type, connection, id, collection, query, options, callback) {
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
      // If we're subscribed, the server already knows which version of the doc
      // we have.
      if (!doc.subscribed && doc.action !== 'subscribe') {
        var c = collectionVersions[doc.collection] = collectionVersions[doc.collection] || {};
        c[doc.name] = doc.version;
      }
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
    msg.o.m = this.docMode === 'sub' ? 'fetch' : this.docMode;
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
  this.connection.bsStart();
  for (var i = 0; i < data.length; i++) {
    var docData = data[i];

    // Types are only put in for the first result in the set and every time the type changes in the list.
    if (docData.type) {
      lastType = docData.type;
    } else {
      docData.type = lastType;
    }

    var doc = this.connection.get(docData.c || this.collection, docData.d, docData);
    // Force the document to know its subscribed if we're in docmode:subscribe.
    if (this.docMode === 'sub') {
      doc.subscribe();
    }
    results.push(doc);
  }
  this.connection.bsEnd();
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

      if (msg.extra) {
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

var MicroEvent;
if (typeof require !== 'undefined') {
  MicroEvent = require('./microevent');
}

MicroEvent.mixin(Query);

})();
