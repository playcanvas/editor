# Front end development

It is possible to develop the editor's front end code codebase using the following commands in the current directory:

```
npm install
npm run develop
```

This will run a rollup script which builds the editor's front end code and starts a development server.

To view the editor using your locally built front end code, you can add the `use_local_frontend` parameter to the url of the editor project you are working on.

For example:

```
https://local-playcanvas.com/editor/project/2535
```

becomes
```
https://local-playcanvas.com/editor/project/2535?use_local_frontend
```


Note that this method can also be used to develop the editor's front end code without having to build the editor's backend code, by using the `dev.playcanvas.com` domain instead of `local-playcanvas.com`.

Any time the editor's front end code is changed (JS or SCSS files which are a dependency of the /public/js/index.js file), the rollup script will automatically rebuild. You can then refresh your editor project to view your changes.

This same script also builds the launch page front end code, as well as that for the code-editor. The use_local_frontend parameter can be applied to the launch page and code editor urls in the same way as editor projects.

### Developing external dependencies

The editor's front end codebase depends on four open source libraries which are maintained by the PlayCanvas team. They are:
- [PCUI](https://github.com/playcanvas/pcui)
- [PCUI Graph](https://github.com/playcanvas/pcui-graph)
- [Editor API](https://github.com/playcanvas/editor-api)
- [PlayCanvas Observer](https://github.com/playcanvas/playcanvas-observer)

These libraries are imported into the editor using their npm packages. If you need to make changes to any of these libraries for the editor, you first need to publish a new npm version of that library. Then you can update the editor's `package.json` file with the new version, then reinstall and rebuild the editor front end codebase.

Before committing your changes to a new NPM package version, you'll likely want to test them with the editor's front end code. To do this, you can use alias environment variables when running the `npm run develop` script. This will point the rollup build to look for an external dependency at the relative path provided by the alias, instead of from the `node_modules` directory.

For instance, if your local PCUI library is located in the same directory as the monorepo, you could use the following command to develop the editor's front end code using your local PCUI library:

```
PCUI_PATH=../../pcui npm run develop
```
