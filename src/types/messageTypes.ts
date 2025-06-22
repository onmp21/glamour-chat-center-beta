
export interface RawMessage {
  session_id: string;
  message: string;
  read_at?: string | null;
  nome_do_contato?: string;
  Nome_do_contato?: string;
  mensagemtype?: string;
  tipo_remetente?: string;
  media_base64?: string;
  media_url?: string;
  fileName?: string;
}
