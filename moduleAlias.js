"use strict";

const ModuleAlias = require("module-alias");

ModuleAlias.addAliases({
  "@root": __dirname,
  "@response": __dirname + "/src/utils/response.js",
  //   '@service': __dirname + '/src/services',
  "@commonUtils": __dirname + "/src/utils/common",
  //   '@userService': __dirname + '/src/services/user',
  //   '@adminService': __dirname + '/src/services/admin',
  //   '@routes': __dirname + '/src/routes',
  //   '@controller': __dirname + '/src/controllers',
  //   '@transformers': __dirname + '/src/transformers',
  //   '@models': __dirname + '/src/models',
  //   '@constants': __dirname + '/src/services/common/Constants.js',
});
