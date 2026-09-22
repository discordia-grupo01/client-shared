/**
 * Fondos fijos para el banner del servidor, como alternativa a subir una
 * imagen propia (Discord tiene lo mismo: un color de banner cuando no hay
 * imagen). Son degradados diagonales (135deg, 3 paradas de color) para que
 * coincidan con el estilo del Figma -- "original" es exactamente el
 * degradado del banner por default en el prototipo
 * (linear-gradient(135deg, #245C6B 0%, #1C293B 58%, #16202f 100%), sacado
 * del source de ServerSettingsModal.tsx en Figma Make), y los otros 5 usan
 * el mismo patrón (135deg, paradas en 0%/55%/100%) con otras paletas para
 * que se vean bien tanto en modo claro como en modo oscuro.
 */
export interface PresetBanner {
  id: string;
  label: string;
  /** Paradas de color del degradado, en el mismo orden que `locations`. */
  colors: [string, string, string];
  /** Posición (0 a 1) de cada parada en `colors`. */
  locations: [number, number, number];
  base64: string;
}

export const PRESET_BANNERS: PresetBanner[] = [
  {
    id: "original",
    label: "Original",
    colors: ["#245C6B", "#1C293B", "#16202f"],
    locations: [0.0, 0.58, 1.0],
    base64:
      "iVBORw0KGgoAAAANSUhEUgAAABgAAAAICAIAAABsw6g0AAAAkElEQVR42nWRwQ0DIQwEN9KVkrLSQfp/HJFm8sAHKOGEkAz2jtfweL7eASEYCCiBoFA3axbiJnvY2qa0g7wB4SwTMXB4tnHYl4IYb7JRk0xHpjzfgEYswZLnCizQHHiFzhlrii4zXWoSfxztQNN8rx36bqWM9B09PD/LXyz9R8+pycbRBa43ulj+t1o0fe2JX4xff4qfwaQuAAAAAElFTkSuQmCC",
  },
  {
    id: "blurple",
    label: "Blurple",
    colors: ["#5865F2", "#4338CA", "#1E1B4B"],
    locations: [0.0, 0.55, 1.0],
    base64:
      "iVBORw0KGgoAAAANSUhEUgAAABgAAAAICAIAAABsw6g0AAAApUlEQVR42mWRSY4EIQzAGIlH9gfm/9LcCI09BwIF3ZdSDFkc6uf1+yeIRcQZK0K5USyg6xCEsrCO6AevDC1PnEFZV9kiByhgVKLvgV9qWVZuXGoDAmN+64g4bT/ULswBb2wQ+nSBqKP3Zf6x/1Tb8t1Zs7skBoS2OqIfz3GaI+zs7EK7MTC0wXyjyxx54zHz2aLdmIcT869p1s9sD20Ml8jXUm3jP2weKQIinBQ3AAAAAElFTkSuQmCC",
  },
  {
    id: "coral",
    label: "Coral",
    colors: ["#FF6B6B", "#EE5253", "#7C2D3B"],
    locations: [0.0, 0.55, 1.0],
    base64:
      "iVBORw0KGgoAAAANSUhEUgAAABgAAAAICAIAAABsw6g0AAAAf0lEQVR42pWQQQ4EIQgE3cTfzv8vIF17wDgYM9lZDqaDUDR8uC6gMeMQ7flrE10Rb+ryeapx/QFKsSSACZNcmOgx4qX5jAATLgwS4ZItRz8RLnwhpKITqq4Y1XPtV51JaROOisaOGzVA50zuW5SltIPGBI06k7l5LZ2Zbanb6Rd3LhU2fOXUFAAAAABJRU5ErkJggg==",
  },
  {
    id: "sunset",
    label: "Atardecer",
    colors: ["#FDBB2D", "#E2517A", "#6C3483"],
    locations: [0.0, 0.55, 1.0],
    base64:
      "iVBORw0KGgoAAAANSUhEUgAAABgAAAAICAIAAABsw6g0AAAAoUlEQVR42n2QORaEQAhEQYi8y9w/mFuNGVsZ2Ha3o8+MrT4FnN8PQhAClxaEIKQuqd4H5rRCNH7rY+9a0Sf6mDeQ5gya2nVJ9S7OXLzYQFbkYI1tfbeNELj2EzLZwIe4U6xmR68/8iIrdtCgFBl6wG8/qhAvsraZHWTFk5jaaf+OTlbmcogbpcgwUZr4DE60xrYeRqLYwF3crxjFIe4PGsUd6898+N71P+8AAAAASUVORK5CYII=",
  },
  {
    id: "forest",
    label: "Bosque",
    colors: ["#2ECC71", "#16A085", "#0B3D2E"],
    locations: [0.0, 0.55, 1.0],
    base64:
      "iVBORw0KGgoAAAANSUhEUgAAABgAAAAICAIAAABsw6g0AAAAoElEQVR42o2QwRXDIAxD7cA83a17diIkrB6AQGjz2gtPgP0t2R+vp8IlV5jCh+5XW/R4d4Ut2iVTeK4lNbVQ/iaejWCuODb2DdEUbhe6CTRAoJG5lnTndtdyhRtDLAYK7CchMNdy/MyvcCPV2ziNgGLDIbMkye1r/mqjrlcPyjTSdNtROnfRN1pDwJi2T96uA7pEM9bxgRnk0whwscnOegOvOqDIZWUoaAAAAABJRU5ErkJggg==",
  },
  {
    id: "violet",
    label: "Violeta",
    colors: ["#A66CFF", "#7C3AED", "#2E1065"],
    locations: [0.0, 0.55, 1.0],
    base64:
      "iVBORw0KGgoAAAANSUhEUgAAABgAAAAICAIAAABsw6g0AAAAhklEQVR42p2RyQ0DMQwDHcDlpq70KFkc5bGXj10EyI8ywKEovz7vhEwKbCKhLCKhLOJwZSalNmd4/YsVeHXTTcjCXVmgwAMTHti50W/WJkT0/sACF1bdeCzfCeGjf6ecY22u50MQY+wxumQnbq92bHSxhPrYwd/tMqGvXxNt92s+wdToFv0F+bAbaNFpREsAAAAASUVORK5CYII=",
  },
];
