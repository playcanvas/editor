import * as apps from './rest/apps';
import * as assets from './rest/assets';
import * as branches from './rest/branches';
import * as checkpoints from './rest/checkpoints';
import * as conflicts from './rest/conflicts';
import * as diff from './rest/diff';
import * as home from './rest/home';
import * as invitations from './rest/invitations';
import * as jobs from './rest/jobs';
import * as merge from './rest/merge';
import * as payment from './rest/payment';
import * as projects from './rest/projects';
import * as scenes from './rest/scenes';
import * as star from './rest/star';
import * as store from './rest/store';
import * as upload from './rest/upload';
import * as users from './rest/users';
import * as watch from './rest/watch';

/**
 * The Rest API provides a set of methods for interacting with the PlayCanvas
 * Editor's RESTful API. This includes methods for managing assets, branches,
 * checkpoints, and other resources. The API is designed to be used in conjunction
 * with the PlayCanvas Editor.
 *
 * @category Internal
 * @ignore
 */
class Rest {
    /**
     * The apps API
     */
    apps = apps;

    /**
     * The assets API
     */
    assets = assets;

    /**
     * The branches API
     */
    branches = branches;

    /**
     * The checkpoints API
     */
    checkpoints = checkpoints;

    /**
     * The conflicts API
     */
    conflicts = conflicts;

    /**
     * The diff API
     */
    diff = diff;

    /**
     * The home API
     */
    home = home;

    /**
     * The invitations API
     */
    invitations = invitations;

    /**
     * The jobs API
     */
    jobs = jobs;

    /**
     * The merge API
     */
    merge = merge;

    /**
     * The payment API
     */
    payment = payment;

    /**
     * The projects API
     */
    projects = projects;

    /**
     * The scenes API
     */
    scenes = scenes;

    /**
     * The star API
     */
    star = star;

    /**
     * The store API
     */
    store = store;

    /**
     * The upload API
     */
    upload = upload;

    /**
     * The users API
     */
    users = users;

    /**
     * The watch API
     */
    watch = watch;
}

export { Rest };
