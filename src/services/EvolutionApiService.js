"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionApiService = void 0;
var EvolutionApiService = /** @class */ (function () {
    function EvolutionApiService(config) {
        var _this = this;
        /**
         * Envia uma mensagem de texto usando a API Evolution v2
         */
        this.sendTextMessage = function (phoneNumber, message) { return __awaiter(_this, void 0, void 0, function () {
            var url, payload, response, errorText, result, error_1;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _g.trys.push([0, 5, , 6]);
                        console.log('📱 [EVOLUTION_API] Enviando mensagem de texto:', {
                            instanceName: this.config.instanceName,
                            phoneNumber: phoneNumber,
                            messageLength: message.length
                        });
                        url = "".concat(this.config.baseUrl, "/message/sendText/").concat(this.config.instanceName);
                        payload = {
                            number: phoneNumber,
                            text: message
                        };
                        console.log('📱 [EVOLUTION_API] URL:', url);
                        console.log('📱 [EVOLUTION_API] Payload:', payload);
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': this.config.apiKey
                                },
                                body: JSON.stringify(payload)
                            })];
                    case 1:
                        response = _g.sent();
                        console.log('📱 [EVOLUTION_API] Status da resposta:', response.status);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _g.sent();
                        console.error('❌ [EVOLUTION_API] Erro na resposta:', errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _g.sent();
                        console.log('📱 [EVOLUTION_API] Resultado:', result);
                        // Verificar se a resposta está no formato esperado
                        if (Array.isArray(result) && result.length > 0 && result[0].success) {
                            return [2 /*return*/, {
                                    success: true,
                                    messageId: (_b = (_a = result[0].data) === null || _a === void 0 ? void 0 : _a.key) === null || _b === void 0 ? void 0 : _b.id
                                }];
                        }
                        // Formato alternativo de resposta
                        if (result.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    messageId: ((_d = (_c = result.data) === null || _c === void 0 ? void 0 : _c.key) === null || _d === void 0 ? void 0 : _d.id) || ((_e = result.key) === null || _e === void 0 ? void 0 : _e.id)
                                }];
                        }
                        if (result.status === 'error') {
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.message || 'Erro desconhecido'
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                messageId: ((_f = result.key) === null || _f === void 0 ? void 0 : _f.id) || result.messageId
                            }];
                    case 5:
                        error_1 = _g.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao enviar mensagem:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: error_1 instanceof Error ? error_1.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Envia uma mensagem de mídia usando a API Evolution v2
         */
        this.sendMediaMessage = function (phoneNumber_1, mediaUrl_1) {
            var args_1 = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args_1[_i - 2] = arguments[_i];
            }
            return __awaiter(_this, __spreadArray([phoneNumber_1, mediaUrl_1], args_1, true), void 0, function (phoneNumber, mediaUrl, caption, mediaType) {
                var url, payload, response, errorText, result, error_2;
                var _a, _b, _c, _d, _e, _f;
                if (caption === void 0) { caption = ''; }
                if (mediaType === void 0) { mediaType = 'image'; }
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            _g.trys.push([0, 5, , 6]);
                            console.log('🎥 [EVOLUTION_API] Enviando mensagem de mídia:', {
                                instanceName: this.config.instanceName,
                                phoneNumber: phoneNumber,
                                mediaType: mediaType,
                                captionLength: caption.length
                            });
                            url = "".concat(this.config.baseUrl, "/message/sendMedia/").concat(this.config.instanceName);
                            payload = {
                                number: phoneNumber,
                                mediaMessage: {
                                    media: mediaUrl,
                                    caption: caption,
                                    mediatype: mediaType
                                }
                            };
                            console.log('🎥 [EVOLUTION_API] URL:', url);
                            console.log('🎥 [EVOLUTION_API] Payload:', payload);
                            return [4 /*yield*/, fetch(url, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'apikey': this.config.apiKey
                                    },
                                    body: JSON.stringify(payload)
                                })];
                        case 1:
                            response = _g.sent();
                            console.log('🎥 [EVOLUTION_API] Status da resposta:', response.status);
                            if (!!response.ok) return [3 /*break*/, 3];
                            return [4 /*yield*/, response.text()];
                        case 2:
                            errorText = _g.sent();
                            console.error('❌ [EVOLUTION_API] Erro na resposta:', errorText);
                            return [2 /*return*/, {
                                    success: false,
                                    error: "HTTP ".concat(response.status, ": ").concat(errorText)
                                }];
                        case 3: return [4 /*yield*/, response.json()];
                        case 4:
                            result = _g.sent();
                            console.log('🎥 [EVOLUTION_API] Resultado:', result);
                            // Verificar se a resposta está no formato esperado
                            if (Array.isArray(result) && result.length > 0 && result[0].success) {
                                return [2 /*return*/, {
                                        success: true,
                                        messageId: (_b = (_a = result[0].data) === null || _a === void 0 ? void 0 : _a.key) === null || _b === void 0 ? void 0 : _b.id
                                    }];
                            }
                            // Formato alternativo de resposta
                            if (result.success) {
                                return [2 /*return*/, {
                                        success: true,
                                        messageId: ((_d = (_c = result.data) === null || _c === void 0 ? void 0 : _c.key) === null || _d === void 0 ? void 0 : _d.id) || ((_e = result.key) === null || _e === void 0 ? void 0 : _e.id)
                                    }];
                            }
                            if (result.status === 'error') {
                                return [2 /*return*/, {
                                        success: false,
                                        error: result.message || 'Erro desconhecido'
                                    }];
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    messageId: ((_f = result.key) === null || _f === void 0 ? void 0 : _f.id) || result.messageId
                                }];
                        case 5:
                            error_2 = _g.sent();
                            console.error('❌ [EVOLUTION_API] Erro ao enviar mídia:', error_2);
                            return [2 /*return*/, {
                                    success: false,
                                    error: error_2 instanceof Error ? error_2.message : 'Erro desconhecido'
                                }];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * Obtém o QR Code para conectar a instância
         */
        this.getQRCodeForInstance = function (instanceName) { return __awaiter(_this, void 0, void 0, function () {
            var instance, url, response, errorText, result, qrCode, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        instance = instanceName || this.config.instanceName;
                        console.log('🔲 [EVOLUTION_API] Obtendo QR Code para:', instance);
                        url = "".concat(this.config.baseUrl, "/instance/connect/").concat(instance);
                        console.log('🔲 [EVOLUTION_API] URL:', url);
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('🔲 [EVOLUTION_API] Status da resposta:', response.status);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro na resposta:', errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('🔲 [EVOLUTION_API] Resultado:', result);
                        qrCode = '';
                        if (result.base64) {
                            qrCode = result.base64;
                        }
                        else if (result.code) {
                            qrCode = result.code;
                        }
                        else if (result.qrcode) {
                            qrCode = result.qrcode;
                        }
                        else if (result.qr) {
                            qrCode = result.qr;
                        }
                        else {
                            console.error('❌ [EVOLUTION_API] Formato de resposta inesperado:', result);
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'QR Code não encontrado na resposta da API'
                                }];
                        }
                        return [2 /*return*/, {
                                success: true,
                                qrCode: qrCode,
                                pairingCode: result.pairingCode
                            }];
                    case 5:
                        error_3 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao obter QR Code:', error_3);
                        return [2 /*return*/, {
                                success: false,
                                error: error_3 instanceof Error ? error_3.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Verifica o status de conexão da instância
         */
        this.getConnectionStatus = function (instanceName) { return __awaiter(_this, void 0, void 0, function () {
            var instance, url, response, errorText, result, state, isConnected, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        instance = instanceName || this.config.instanceName;
                        console.log('🔍 [EVOLUTION_API] Verificando status de conexão para:', instance);
                        url = "".concat(this.config.baseUrl, "/instance/connectionState/").concat(instance);
                        console.log('🔍 [EVOLUTION_API] URL:', url);
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _b.sent();
                        console.log('🔍 [EVOLUTION_API] Status da resposta:', response.status);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _b.sent();
                        console.error('❌ [EVOLUTION_API] Erro na resposta:', errorText);
                        return [2 /*return*/, {
                                success: false,
                                connected: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _b.sent();
                        console.log('🔍 [EVOLUTION_API] Resultado:', result);
                        state = '';
                        if (result.state) {
                            state = result.state;
                        }
                        else if ((_a = result.instance) === null || _a === void 0 ? void 0 : _a.state) {
                            state = result.instance.state;
                        }
                        else if (result.connectionState) {
                            state = result.connectionState;
                        }
                        isConnected = state === 'open';
                        return [2 /*return*/, {
                                success: true,
                                connected: isConnected,
                                state: state,
                                error: result.error
                            }];
                    case 5:
                        error_4 = _b.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao verificar status:', error_4);
                        return [2 /*return*/, {
                                success: false,
                                connected: false,
                                error: error_4 instanceof Error ? error_4.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Reinicia uma instância
         */
        this.restartInstance = function (instanceName) { return __awaiter(_this, void 0, void 0, function () {
            var instance, url, response, result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        instance = instanceName || this.config.instanceName;
                        console.log('🔄 [EVOLUTION_API] Reiniciando instância:', instance);
                        url = "".concat(this.config.baseUrl, "/instance/restart/").concat(instance);
                        return [4 /*yield*/, fetch(url, {
                                method: 'PUT',
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            console.error('❌ [EVOLUTION_API] Erro ao reiniciar:', response.status);
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        console.log('🔄 [EVOLUTION_API] Resultado:', result);
                        return [2 /*return*/, result.status !== 'error'];
                    case 3:
                        error_5 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao reiniciar instância:', error_5);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Faz logout de uma instância
         */
        this.logoutInstance = function (instanceName) { return __awaiter(_this, void 0, void 0, function () {
            var instance, url, response, errorText, result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        instance = instanceName || this.config.instanceName;
                        console.log('🚪 [EVOLUTION_API] Fazendo logout da instância:', instance);
                        url = "".concat(this.config.baseUrl, "/instance/logout/").concat(instance);
                        return [4 /*yield*/, fetch(url, {
                                method: 'DELETE', // Mudando de POST para DELETE
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao fazer logout:', response.status, errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('🚪 [EVOLUTION_API] Resultado:', result);
                        if (result.status === 'error') {
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.message || 'Erro ao fazer logout'
                                }];
                        }
                        return [2 /*return*/, {
                                success: true
                            }];
                    case 5:
                        error_6 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao fazer logout:', error_6);
                        return [2 /*return*/, {
                                success: false,
                                error: error_6 instanceof Error ? error_6.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Cria uma nova instância (versão simples para compatibilidade)
         */
        this.createInstanceSimple = function (instanceName) { return __awaiter(_this, void 0, void 0, function () {
            var url, payload, response, errorText, result, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('➕ [EVOLUTION_API] Criando instância (simples):', instanceName);
                        url = "".concat(this.config.baseUrl, "/instance/create");
                        payload = {
                            instanceName: instanceName,
                            integration: "WHATSAPP-BAILEYS", // Campo obrigatório
                            token: this.config.apiKey
                        };
                        console.log('➕ [EVOLUTION_API] Payload:', JSON.stringify(payload, null, 2));
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': this.config.apiKey
                                },
                                body: JSON.stringify(payload)
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('➕ [EVOLUTION_API] Status da resposta:', response.status);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao criar instância:', response.status, errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('➕ [EVOLUTION_API] Resultado:', result);
                        if (result.status === 'error') {
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.message || 'Erro ao criar instância'
                                }];
                        }
                        return [2 /*return*/, {
                                success: true
                            }];
                    case 5:
                        error_7 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao criar instância:', error_7);
                        return [2 /*return*/, {
                                success: false,
                                error: error_7 instanceof Error ? error_7.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Deleta uma instância (versão simples para compatibilidade)
         */
        this.deleteInstance = function (instanceName) { return __awaiter(_this, void 0, void 0, function () {
            var instance, url, response, errorText, result, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        instance = instanceName || this.config.instanceName;
                        console.log('🗑️ [EVOLUTION_API] Deletando instância:', instance);
                        url = "".concat(this.config.baseUrl, "/instance/delete/").concat(instance);
                        return [4 /*yield*/, fetch(url, {
                                method: 'DELETE',
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao deletar instância:', response.status, errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('🗑️ [EVOLUTION_API] Resultado:', result);
                        if (result.status === 'error') {
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.message || 'Erro ao deletar instância'
                                }];
                        }
                        return [2 /*return*/, {
                                success: true
                            }];
                    case 5:
                        error_8 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao deletar instância:', error_8);
                        return [2 /*return*/, {
                                success: false,
                                error: error_8 instanceof Error ? error_8.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Lista todas as instâncias
         */
        this.fetchInstances = function () { return __awaiter(_this, void 0, void 0, function () {
            var url, response, result, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log('📋 [EVOLUTION_API] Listando instâncias');
                        url = "".concat(this.config.baseUrl, "/instance/fetchInstances");
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', response.status);
                            return [2 /*return*/, []];
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        console.log('📋 [EVOLUTION_API] Resultado:', result);
                        return [2 /*return*/, Array.isArray(result) ? result : []];
                    case 3:
                        error_9 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error_9);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Valida a conexão com a API Evolution
         */
        this.validateApi = function () { return __awaiter(_this, void 0, void 0, function () {
            var url, response, errorText, result, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('🔍 [EVOLUTION_API] Validando conexão com a API...');
                        url = "".concat(this.config.baseUrl, "/instance/fetchInstances");
                        console.log('🔍 [EVOLUTION_API] URL de validação:', url);
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('🔍 [EVOLUTION_API] Status da resposta de validação:', response.status);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro na validação:', errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('✅ [EVOLUTION_API] API validada com sucesso:', result);
                        return [2 /*return*/, {
                                success: true
                            }];
                    case 5:
                        error_10 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao validar API:', error_10);
                        return [2 /*return*/, {
                                success: false,
                                error: error_10 instanceof Error ? error_10.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Lista todas as instâncias com informações detalhadas
         */
        this.listInstances = function () { return __awaiter(_this, void 0, void 0, function () {
            var url, response, errorText, result, instances, state, connectionStatus, finalStatus, error_11;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('📋 [EVOLUTION_API] Listando instâncias detalhadas...');
                        url = "".concat(this.config.baseUrl, "/instance/fetchInstances");
                        console.log('📋 [EVOLUTION_API] URL:', url);
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('📋 [EVOLUTION_API] Status da resposta:', response.status);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('📋 [EVOLUTION_API] Resultado bruto:', result);
                        instances = [];
                        if (Array.isArray(result)) {
                            instances = result.map(function (instance) {
                                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                                // Debug: verificar estrutura dos dados
                                console.log('🔍 [DEBUG] Estrutura da instância:', JSON.stringify(instance, null, 2));
                                // Verificar múltiplos campos para determinar o status real
                                var state = ((_a = instance.instance) === null || _a === void 0 ? void 0 : _a.state) || instance.state || 'close';
                                var connectionStatus = ((_b = instance.instance) === null || _b === void 0 ? void 0 : _b.connectionStatus) || instance.connectionStatus || 'close';
                                // Priorizar connectionStatus se disponível, senão usar state
                                var finalStatus = connectionStatus !== 'close' ? connectionStatus : state;
                                // Obter o nome da instância - verificar múltiplos campos possíveis
                                var instanceName = ((_c = instance.instance) === null || _c === void 0 ? void 0 : _c.instanceName) ||
                                    instance.instanceName ||
                                    instance.name ||
                                    ((_d = instance.instance) === null || _d === void 0 ? void 0 : _d.name) ||
                                    instance.instanceId ||
                                    ((_e = instance.instance) === null || _e === void 0 ? void 0 : _e.instanceId);
                                console.log('🔍 [DEBUG] Nome extraído:', instanceName);
                                return {
                                    instanceName: instanceName || 'unknown',
                                    status: finalStatus,
                                    serverUrl: ((_f = instance.instance) === null || _f === void 0 ? void 0 : _f.serverUrl) || instance.serverUrl || _this.config.baseUrl,
                                    apikey: ((_g = instance.instance) === null || _g === void 0 ? void 0 : _g.apikey) || instance.apikey || _this.config.apiKey,
                                    owner: ((_h = instance.instance) === null || _h === void 0 ? void 0 : _h.owner) || instance.owner || 'unknown',
                                    profileName: ((_j = instance.instance) === null || _j === void 0 ? void 0 : _j.profileName) || instance.profileName || '',
                                    profilePictureUrl: ((_k = instance.instance) === null || _k === void 0 ? void 0 : _k.profilePictureUrl) || instance.profilePictureUrl || '',
                                    integration: ((_l = instance.instance) === null || _l === void 0 ? void 0 : _l.integration) || instance.integration || 'WHATSAPP-BAILEYS',
                                    number: ((_m = instance.instance) === null || _m === void 0 ? void 0 : _m.number) || instance.number || '',
                                    connectionStatus: finalStatus
                                };
                            }).filter(function (instance) {
                                // Filtrar apenas instâncias que realmente não têm nome válido
                                console.log('🔍 [DEBUG] Verificando instância:', instance.instanceName);
                                var hasValidName = instance.instanceName &&
                                    instance.instanceName.trim() !== '' &&
                                    instance.instanceName !== 'unknown' &&
                                    instance.instanceName.length > 2; // Nome deve ter pelo menos 3 caracteres
                                console.log('🔍 [DEBUG] Nome válido?', hasValidName, 'para:', instance.instanceName);
                                return hasValidName;
                            });
                        }
                        else if (result.instance) {
                            state = result.instance.state || 'close';
                            connectionStatus = result.instance.connectionStatus || 'close';
                            finalStatus = connectionStatus !== 'close' ? connectionStatus : state;
                            instances = [{
                                    instanceName: result.instance.instanceName || 'unknown',
                                    status: finalStatus,
                                    serverUrl: result.instance.serverUrl || this.config.baseUrl,
                                    apikey: result.instance.apikey || this.config.apiKey,
                                    owner: result.instance.owner || 'unknown',
                                    profileName: result.instance.profileName || '',
                                    profilePictureUrl: result.instance.profilePictureUrl || '',
                                    integration: result.instance.integration || 'WHATSAPP-BAILEYS',
                                    number: result.instance.number || '',
                                    connectionStatus: finalStatus
                                }];
                        }
                        console.log('📋 [EVOLUTION_API] Instâncias processadas:', instances);
                        return [2 /*return*/, {
                                success: true,
                                instances: instances
                            }];
                    case 5:
                        error_11 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao listar instâncias:', error_11);
                        return [2 /*return*/, {
                                success: false,
                                error: error_11 instanceof Error ? error_11.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Configura webhook para uma instância
         */
        this.setWebhook = function (webhookUrl, events, instanceName) { return __awaiter(_this, void 0, void 0, function () {
            var instance, url, payload, response, errorText, result, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        instance = instanceName || this.config.instanceName;
                        console.log('🔗 [EVOLUTION_API] Configurando webhook para instância:', instance);
                        console.log('🔗 [EVOLUTION_API] URL do webhook:', webhookUrl);
                        console.log('🔗 [EVOLUTION_API] Eventos:', events);
                        url = "".concat(this.config.baseUrl, "/webhook/set/").concat(instance);
                        console.log('🔗 [EVOLUTION_API] URL da API:', url);
                        payload = {
                            webhook: {
                                url: webhookUrl,
                                enabled: true,
                                events: events,
                                webhook_by_events: false
                            }
                        };
                        console.log('🔗 [EVOLUTION_API] Payload:', JSON.stringify(payload, null, 2));
                        return [4 /*yield*/, fetch(url, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': this.config.apiKey
                                },
                                body: JSON.stringify(payload)
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('🔗 [EVOLUTION_API] Status da resposta:', response.status);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao configurar webhook:', errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('🔗 [EVOLUTION_API] Resultado:', result);
                        return [2 /*return*/, {
                                success: true
                            }];
                    case 5:
                        error_12 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao configurar webhook:', error_12);
                        return [2 /*return*/, {
                                success: false,
                                error: error_12 instanceof Error ? error_12.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        /**
         * Obtém configuração do webhook de uma instância
         */
        this.getWebhook = function (instanceName) { return __awaiter(_this, void 0, void 0, function () {
            var instance, url, response, errorText, result, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        instance = instanceName || this.config.instanceName;
                        console.log('📋 [EVOLUTION_API] Obtendo webhook da instância:', instance);
                        url = "".concat(this.config.baseUrl, "/webhook/find/").concat(instance);
                        console.log('📋 [EVOLUTION_API] URL:', url);
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'apikey': this.config.apiKey
                                }
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('📋 [EVOLUTION_API] Status da resposta:', response.status);
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.text()];
                    case 2:
                        errorText = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao obter webhook:', errorText);
                        return [2 /*return*/, {
                                success: false,
                                error: "HTTP ".concat(response.status, ": ").concat(errorText)
                            }];
                    case 3: return [4 /*yield*/, response.json()];
                    case 4:
                        result = _a.sent();
                        console.log('📋 [EVOLUTION_API] Resultado:', result);
                        return [2 /*return*/, {
                                success: true,
                                webhook: result
                            }];
                    case 5:
                        error_13 = _a.sent();
                        console.error('❌ [EVOLUTION_API] Erro ao obter webhook:', error_13);
                        return [2 /*return*/, {
                                success: false,
                                error: error_13 instanceof Error ? error_13.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        this.config = __assign(__assign({}, config), { baseUrl: config.baseUrl.replace(/\/$/, '') // Remove trailing slash
         });
    }
    return EvolutionApiService;
}());
exports.EvolutionApiService = EvolutionApiService;
