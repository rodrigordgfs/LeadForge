import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { DiagnosisResponse } from "../types.js";
import { pdfStyles } from "./styles.js";

export interface DiagnosisTemplateProps {
  leadName: string;
  diagnosis: DiagnosisResponse;
}

export function DiagnosisTemplate({
  leadName,
  diagnosis,
}: DiagnosisTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Diagnóstico Digital</Text>
        <Text style={pdfStyles.subtitle}>{leadName}</Text>

        <View>
          <Text style={pdfStyles.narrative}>{diagnosis.narrative}</Text>
        </View>
      </Page>
    </Document>
  );
}
