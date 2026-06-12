import { StyleSheet } from "@react-pdf/renderer";
import { geistTokens, pdfTokens } from "@leadforge/ui/tokens";

const px = (value: string) => Number.parseInt(value, 10);

export { geistTokens, pdfTokens };

export const pdfStyles = StyleSheet.create({
  page: {
    padding: px(pdfTokens.spacing["10"]),
    fontSize: 11,
    fontFamily: pdfTokens.fontSans,
    lineHeight: 1.6,
    color: pdfTokens.foreground,
    backgroundColor: pdfTokens.background,
  },
  title: {
    fontSize: 20,
    marginBottom: px(pdfTokens.spacing["2"]),
    fontFamily: pdfTokens.fontSans,
    fontWeight: 600,
    color: pdfTokens.foreground,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: px(pdfTokens.spacing["6"]),
    color: pdfTokens.mutedForeground,
  },
  narrative: {
    textAlign: "justify",
    color: pdfTokens.foreground,
  },
  section: {
    marginBottom: px(pdfTokens.spacing["4"]),
  },
  label: {
    fontFamily: pdfTokens.fontSans,
    fontWeight: 600,
    marginBottom: px(pdfTokens.spacing["1"]),
    color: pdfTokens.foreground,
  },
  value: {
    marginBottom: px(pdfTokens.spacing["2"]),
    color: pdfTokens.foreground,
  },
  pageName: {
    fontSize: 14,
    fontFamily: pdfTokens.fontSans,
    fontWeight: 600,
    marginBottom: px(pdfTokens.spacing["2"]),
    marginTop: px(pdfTokens.spacing["3"]),
    color: pdfTokens.foreground,
  },
  sectionName: {
    fontFamily: pdfTokens.fontSans,
    fontWeight: 600,
    marginBottom: px(pdfTokens.spacing["1"]),
    marginTop: px(pdfTokens.spacing["2"]),
    color: pdfTokens.foreground,
  },
  component: {
    marginLeft: px(pdfTokens.spacing["3"]),
    marginBottom: 2,
    fontFamily: pdfTokens.fontMono,
    fontSize: 10,
    color: pdfTokens.mutedForeground,
  },
});
