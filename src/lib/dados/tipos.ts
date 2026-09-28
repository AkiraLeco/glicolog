export type RegistroGlicemia = { tipo: "glicemia"; id: string; em: Date; valor: number };

export type RegistroInsulina = {
  tipo: "insulina";
  id: string;
  em: Date;
  tipoInsulina: "basal" | "bolus";
  unidades: number;
};

export type Registro = RegistroGlicemia | RegistroInsulina;
