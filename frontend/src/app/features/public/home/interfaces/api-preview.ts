export interface IApiPreview {
  success: boolean;
  message: string;
  data: {
    productos: number;
    alertasStock: number;
    usuario: string;
  };
}
