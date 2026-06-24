"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassportController = void 0;
const common_1 = require("@nestjs/common");
const passport_service_1 = require("./passport.service");
const supabase_auth_guard_1 = require("../auth/supabase-auth.guard");
let PassportController = class PassportController {
    passportService;
    constructor(passportService) {
        this.passportService = passportService;
    }
    async preparePassport(body) {
        return this.passportService.prepareProof(body.portfolioValue, body.tier, body.userEmail);
    }
    async getMyPassport(req) {
        const email = req.user?.email;
        if (!email)
            return null;
        return this.passportService.getMyPassport(email);
    }
    async confirmPassport(body, req) {
        const email = req.user?.email;
        if (!email)
            return null;
        return this.passportService.confirmPassport(body.commitment, email);
    }
    async searchPassport(query) {
        console.log(`>> ${query}`);
        if (!query)
            return null;
        return this.passportService.searchPassport(query);
    }
    async verifyPassport(commitmentHash) {
        return this.passportService.verifyPassport(commitmentHash);
    }
    async getPassport(userEmail) {
        return this.passportService.getPassport(userEmail);
    }
};
exports.PassportController = PassportController;
__decorate([
    (0, common_1.Post)('prepare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PassportController.prototype, "preparePassport", null);
__decorate([
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Get)('my'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PassportController.prototype, "getMyPassport", null);
__decorate([
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    (0, common_1.Post)('confirm'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PassportController.prototype, "confirmPassport", null);
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PassportController.prototype, "searchPassport", null);
__decorate([
    (0, common_1.Get)('verify/:commitmentHash'),
    __param(0, (0, common_1.Param)('commitmentHash')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PassportController.prototype, "verifyPassport", null);
__decorate([
    (0, common_1.Get)(':userEmail'),
    __param(0, (0, common_1.Param)('userEmail')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PassportController.prototype, "getPassport", null);
exports.PassportController = PassportController = __decorate([
    (0, common_1.Controller)('api/passport'),
    __metadata("design:paramtypes", [passport_service_1.PassportService])
], PassportController);
//# sourceMappingURL=passport.controller.js.map