import QRCode from "qrcode";

export interface QrOptions {
  width?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
}

/**
 * Generates an SVG string representation of a QR code styled for The Royal Knot.
 */
export async function generateQrSvg(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const {
    margin = 2,
    darkColor = "#151B2B", // Royal Navy
    lightColor = "#F7F5F0", // Royal Ivory
  } = options;

  return QRCode.toString(text, {
    type: "svg",
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generates a base64 Data URL (image/png) for a QR code.
 */
export async function generateQrDataUrl(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const {
    width = 280,
    margin = 2,
    darkColor = "#151B2B",
    lightColor = "#F7F5F0",
  } = options;

  return QRCode.toDataURL(text, {
    width,
    margin,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    errorCorrectionLevel: "M",
  });
}
