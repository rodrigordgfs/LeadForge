import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { DiagnosisResponse } from "../types.js";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.6,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 24,
    color: "#444444",
  },
  narrative: {
    textAlign: "justify",
  },
});

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
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Diagnóstico Digital</Text>
        <Text style={styles.subtitle}>{leadName}</Text>

        <View>
          <Text style={styles.narrative}>{diagnosis.narrative}</Text>
        </View>
      </Page>
    </Document>
  );
}
