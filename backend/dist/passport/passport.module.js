"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportModule = void 0;
const common_1 = require("@nestjs/common");
const passport_controller_1 = require("./passport.controller");
const passport_service_1 = require("./passport.service");
const vascore_module_1 = require("../vascore/vascore.module");
let PassportModule = class PassportModule {
};
exports.PassportModule = PassportModule;
exports.PassportModule = PassportModule = __decorate([
    (0, common_1.Module)({
        controllers: [passport_controller_1.PassportController],
        providers: [passport_service_1.PassportService],
        exports: [passport_service_1.PassportService],
        imports: [vascore_module_1.VascoreModule],
    })
], PassportModule);
//# sourceMappingURL=passport.module.js.map