"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webpackOverride = void 0;
var tailwind_1 = require("@remotion/tailwind");
var webpackOverride = function (currentConfiguration) {
    return (0, tailwind_1.enableTailwind)(currentConfiguration);
};
exports.webpackOverride = webpackOverride;