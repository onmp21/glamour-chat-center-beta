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
Object.defineProperty(exports, "__esModule", { value: true });
exports.evolutionMessageService = exports.EvolutionMessageService = void 0;
var client_1 = require("@/integrations/supabase/client");
var EvolutionApiService_1 = require("./EvolutionApiService");
var EvolutionMessageService = /** @class */ (function () {
    function EvolutionMessageService() {
    }
    /**
     * Obter configurações da API Evolution do localStorage
     */
    EvolutionMessageService.prototype.getEvolutionApiConfig = function () {
        try {
            var saved = localStorage.getItem('evolution_api_connection');
            if (saved) {
                var connection = JSON.parse(saved);
                if (connection.isValidated && connection.baseUrl && connection.apiKey) {
                    return {
                        baseUrl: connection.baseUrl,
                        apiKey: connection.apiKey
                    };
                }
            }
            return null;
        }
        catch (error) {
            console.error('❌ [EVOLUTION_MESSAGE] Erro ao obter configurações:', error);
            return null;
        }
    };
    /**
     * Obter configurações de IA do localStorage ou Supabase
     */
    EvolutionMessageService.prototype.getOpenAIConfigFromSupabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var apiKey, _a, data, error, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        apiKey = localStorage.getItem('openai_api_key');
                        if (apiKey) {
                            return [2 /*return*/, { apiKey: apiKey }];
                        }
                        return [4 /*yield*/, client_1.supabase
                                .from('ai_providers')
                                .select('api_key')
                                .eq('provider_type', 'openai')
                                .eq('is_active', true)
                                .single()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error || !data) {
                            console.warn('⚠️ [EVOLUTION_MESSAGE] API key da OpenAI não encontrada');
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, { apiKey: data.api_key }];
                    case 2:
                        error_1 = _b.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao obter configurações de IA:', error_1);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Atualizar configurações da OpenAI no openaiService
     */
    EvolutionMessageService.prototype.updateOpenAIService = function () {
        return __awaiter(this, void 0, void 0, function () {
            var config, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getOpenAIConfigFromSupabase()];
                    case 1:
                        config = _a.sent();
                        if (config) {
                            // Atualizar localStorage para que o openaiService possa usar
                            localStorage.setItem('openai_api_key', config.apiKey);
                            console.log('✅ [EVOLUTION_MESSAGE] Configurações da OpenAI atualizadas');
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao atualizar configurações da OpenAI:', error_2);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Obter mapeamento de instância para um canal específico
     */
    EvolutionMessageService.prototype.getChannelInstanceMapping = function (channelId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, error, mapping, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        console.log("\uD83D\uDD0D [EVOLUTION_MESSAGE] Buscando mapeamento para canal: ".concat(channelId));
                        console.log("\uD83D\uDD0D [EVOLUTION_MESSAGE] Channel ID recebido: ".concat(channelId));
                        console.log("\uD83D\uDD0D [EVOLUTION_MESSAGE] Tipo de channelId: ".concat(typeof channelId));
                        return [4 /*yield*/, client_1.supabase
                                .from("channel_instance_mappings")
                                .select("*")
                                .eq("channel_id", channelId)
                                .eq("is_active", true)];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        console.log("🔍 [EVOLUTION_MESSAGE] Resultado da consulta Supabase - Data:", data);
                        console.log("🔍 [EVOLUTION_MESSAGE] Resultado da consulta Supabase - Error:", error);
                        if (error) {
                            console.error("❌ [EVOLUTION_MESSAGE] Erro ao buscar mapeamento:", error);
                            console.error("❌ [EVOLUTION_MESSAGE] Dados retornados:", data);
                            return [2 /*return*/, null];
                        }
                        if (!data || data.length === 0) {
                            console.warn("⚠️ [EVOLUTION_MESSAGE] Nenhum mapeamento encontrado para o canal:", channelId);
                            console.warn("⚠️ [EVOLUTION_MESSAGE] Dados retornados:", data);
                            return [2 /*return*/, null];
                        }
                        mapping = Array.isArray(data) ? data[0] : data;
                        console.log("✅ [EVOLUTION_MESSAGE] Mapeamento encontrado:", mapping);
                        return [2 /*return*/, mapping];
                    case 2:
                        error_3 = _b.sent();
                        console.error("❌ [EVOLUTION_MESSAGE] Erro ao buscar mapeamento:", error_3);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Criar instância do serviço Evolution API baseado no mapeamento do canal
     */
    EvolutionMessageService.prototype.createEvolutionService = function (mapping) {
        var config = {
            baseUrl: mapping.base_url,
            apiKey: mapping.api_key,
            instanceName: mapping.instance_name
        };
        return new EvolutionApiService_1.EvolutionApiService(config);
    };
    /**
     * Salvar mensagem enviada na tabela específica do canal
     */
    EvolutionMessageService.prototype.saveMessageToChannel = function (channelId_1, phoneNumber_1, message_1) {
        return __awaiter(this, arguments, void 0, function (channelId, phoneNumber, message, messageType, mediaBase64) {
            var getTableNameForChannel, tableName, messageData, error, error_4;
            if (messageType === void 0) { messageType = 'text'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        getTableNameForChannel = function (channelId) {
                            var channelTableMapping = {
                                // UUIDs do Supabase
                                'af1e5797-edc6-4ba3-a57a-25cf7297c4d6': 'yelena_ai_conversas',
                                '011b69ba-cf25-4f63-af2e-4ad0260d9516': 'canarana_conversas',
                                'b7996f75-41a7-4725-8229-564f31868027': 'souto_soares_conversas',
                                '621abb21-60b2-4ff2-a0a6-172a94b4b65c': 'joao_dourado_conversas',
                                '64d8acad-c645-4544-a1e6-2f0825fae00b': 'america_dourada_conversas',
                                'd8087e7b-5b06-4e26-aa05-6fc51fd4cdce': 'gerente_lojas_conversas',
                                'd2892900-ca8f-4b08-a73f-6b7aa5866ff7': 'gerente_externo_conversas',
                                // Nomes legados para compatibilidade
                                'chat': 'yelena_ai_conversas',
                                'canarana': 'canarana_conversas',
                                'souto-soares': 'souto_soares_conversas',
                                'joao-dourado': 'joao_dourado_conversas',
                                'america-dourada': 'america_dourada_conversas',
                                'gerente-lojas': 'gerente_lojas_conversas',
                                'gerente-externo': 'gerente_externo_conversas'
                            };
                            return channelTableMapping[channelId] || 'yelena_ai_conversas';
                        };
                        tableName = getTableNameForChannel(channelId);
                        console.log("\uD83D\uDCBE [EVOLUTION_MESSAGE] Salvando mensagem na tabela: ".concat(tableName));
                        messageData = {
                            session_id: phoneNumber,
                            message: message,
                            nome_do_contato: 'Atendente', // Mensagem enviada pelo atendente
                            tipo_remetente: 'agent',
                            mensagemtype: messageType,
                            media_base64: mediaBase64 || null,
                            is_read: true,
                            read_at: new Date().toISOString()
                        };
                        return [4 /*yield*/, client_1.supabase
                                .from(tableName)
                                .insert(messageData)];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            console.error('❌ [EVOLUTION_MESSAGE] Erro ao salvar mensagem:', error);
                        }
                        else {
                            console.log('✅ [EVOLUTION_MESSAGE] Mensagem salva com sucesso');
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        error_4 = _a.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao salvar mensagem:', error_4);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enviar mensagem de texto
     */
    EvolutionMessageService.prototype.sendTextMessage = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var apiConfig, mapping, config, evolutionService, result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('📤 [EVOLUTION_MESSAGE] Enviando mensagem de texto:', {
                            channelId: request.channelId,
                            phoneNumber: request.phoneNumber,
                            messageLength: request.message.length
                        });
                        apiConfig = this.getEvolutionApiConfig();
                        if (!apiConfig) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Configurações da API Evolution não encontradas. Configure na seção API Evolution.'
                                }];
                        }
                        return [4 /*yield*/, this.getChannelInstanceMapping(request.channelId)];
                    case 1:
                        mapping = _a.sent();
                        if (!mapping) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Nenhuma instância configurada para este canal. Configure o mapeamento na seção API Evolution.'
                                }];
                        }
                        config = {
                            baseUrl: apiConfig.baseUrl || mapping.base_url,
                            apiKey: apiConfig.apiKey || mapping.api_key,
                            instanceName: mapping.instance_name
                        };
                        evolutionService = new EvolutionApiService_1.EvolutionApiService(config);
                        return [4 /*yield*/, evolutionService.sendTextMessage(request.phoneNumber, request.message)];
                    case 2:
                        result = _a.sent();
                        if (!result.success) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.saveMessageToChannel(request.channelId, request.phoneNumber, request.message, 'text')];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, result];
                    case 5:
                        error_5 = _a.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao enviar mensagem de texto:', error_5);
                        return [2 /*return*/, {
                                success: false,
                                error: error_5 instanceof Error ? error_5.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enviar mensagem de mídia
     */
    EvolutionMessageService.prototype.sendMediaMessage = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var mapping, evolutionService, result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('📤 [EVOLUTION_MESSAGE] Enviando mensagem de mídia:', {
                            channelId: request.channelId,
                            phoneNumber: request.phoneNumber,
                            mediaType: request.mediaType,
                            hasCaption: !!request.caption
                        });
                        if (!request.mediaUrl) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'URL da mídia é obrigatória'
                                }];
                        }
                        return [4 /*yield*/, this.getChannelInstanceMapping(request.channelId)];
                    case 1:
                        mapping = _a.sent();
                        if (!mapping) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Nenhuma instância configurada para este canal'
                                }];
                        }
                        evolutionService = this.createEvolutionService(mapping);
                        return [4 /*yield*/, evolutionService.sendMediaMessage(request.phoneNumber, request.mediaUrl, request.caption || '', request.mediaType || 'image')];
                    case 2:
                        result = _a.sent();
                        if (!result.success) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.saveMessageToChannel(request.channelId, request.phoneNumber, request.caption || '[Mídia]', request.mediaType || 'image', request.mediaUrl // Salvar URL da mídia como base64 temporariamente
                            )];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/, result];
                    case 5:
                        error_6 = _a.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao enviar mensagem de mídia:', error_6);
                        return [2 /*return*/, {
                                success: false,
                                error: error_6 instanceof Error ? error_6.message : 'Erro desconhecido'
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Verificar status da conexão da instância do canal
     */
    EvolutionMessageService.prototype.checkChannelConnectionStatus = function (channelId) {
        return __awaiter(this, void 0, void 0, function () {
            var mapping, evolutionService, status_1, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("\uD83D\uDD0D [EVOLUTION_MESSAGE] Verificando status de conex\u00E3o para canal: ".concat(channelId));
                        return [4 /*yield*/, this.getChannelInstanceMapping(channelId)];
                    case 1:
                        mapping = _a.sent();
                        if (!mapping) {
                            return [2 /*return*/, {
                                    success: false,
                                    connected: false,
                                    error: 'Nenhuma instância configurada para este canal'
                                }];
                        }
                        evolutionService = this.createEvolutionService(mapping);
                        return [4 /*yield*/, evolutionService.getConnectionStatus()];
                    case 2:
                        status_1 = _a.sent();
                        return [2 /*return*/, {
                                success: status_1.success,
                                connected: status_1.connected,
                                instanceName: mapping.instance_name,
                                error: status_1.error
                            }];
                    case 3:
                        error_7 = _a.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao verificar status:', error_7);
                        return [2 /*return*/, {
                                success: false,
                                connected: false,
                                error: error_7 instanceof Error ? error_7.message : 'Erro desconhecido'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Obter QR Code para conectar instância do canal
     */
    EvolutionMessageService.prototype.getChannelQRCode = function (channelId) {
        return __awaiter(this, void 0, void 0, function () {
            var mapping, evolutionService, qrResult, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("\uD83D\uDD32 [EVOLUTION_MESSAGE] Obtendo QR Code para canal: ".concat(channelId));
                        return [4 /*yield*/, this.getChannelInstanceMapping(channelId)];
                    case 1:
                        mapping = _a.sent();
                        if (!mapping) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: 'Nenhuma instância configurada para este canal'
                                }];
                        }
                        evolutionService = this.createEvolutionService(mapping);
                        return [4 /*yield*/, evolutionService.getQRCodeForInstance()];
                    case 2:
                        qrResult = _a.sent();
                        return [2 /*return*/, {
                                success: qrResult.success,
                                qrCode: qrResult.qrCode,
                                instanceName: mapping.instance_name,
                                error: qrResult.error
                            }];
                    case 3:
                        error_8 = _a.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao obter QR Code:', error_8);
                        return [2 /*return*/, {
                                success: false,
                                error: error_8 instanceof Error ? error_8.message : 'Erro desconhecido'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Listar todos os mapeamentos de canal-instância
     */
    EvolutionMessageService.prototype.listChannelMappings = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, error, error_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        console.log('📋 [EVOLUTION_MESSAGE] Listando mapeamentos de canal-instância');
                        return [4 /*yield*/, client_1.supabase
                                .from('channel_instance_mappings')
                                .select('*')
                                .order('created_at', { ascending: false })];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            console.error('❌ [EVOLUTION_MESSAGE] Erro ao listar mapeamentos:', error);
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, data || []];
                    case 2:
                        error_9 = _b.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao listar mapeamentos:', error_9);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Criar ou atualizar mapeamento de canal-instância
     */
    EvolutionMessageService.prototype.createOrUpdateChannelMapping = function (mapping) {
        return __awaiter(this, void 0, void 0, function () {
            var error, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('💾 [EVOLUTION_MESSAGE] Criando/atualizando mapeamento:', mapping);
                        return [4 /*yield*/, client_1.supabase
                                .from('channel_instance_mappings')
                                .upsert(__assign(__assign({}, mapping), { updated_at: new Date().toISOString() }), {
                                onConflict: 'channel_id'
                            })];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            console.error('❌ [EVOLUTION_MESSAGE] Erro ao salvar mapeamento:', error);
                            return [2 /*return*/, {
                                    success: false,
                                    error: error.message
                                }];
                        }
                        console.log('✅ [EVOLUTION_MESSAGE] Mapeamento salvo com sucesso');
                        return [2 /*return*/, {
                                success: true
                            }];
                    case 2:
                        error_10 = _a.sent();
                        console.error('❌ [EVOLUTION_MESSAGE] Erro ao salvar mapeamento:', error_10);
                        return [2 /*return*/, {
                                success: false,
                                error: error_10 instanceof Error ? error_10.message : 'Erro desconhecido'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return EvolutionMessageService;
}());
exports.EvolutionMessageService = EvolutionMessageService;
// Instância singleton do serviço
exports.evolutionMessageService = new EvolutionMessageService();
