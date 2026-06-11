import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ProposalResponse } from "../types.js";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
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
  section: {
    marginBottom: 16,
  },
  label: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  value: {
    marginBottom: 8,
  },
});

export interface ProposalTemplateProps {
  leadName: string;
  proposal: ProposalResponse;
}

export function ProposalTemplate({ leadName, proposal }: ProposalTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Proposta Comercial</Text>
        <Text style={styles.subtitle}>{leadName}</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Escopo</Text>
          <Text style={styles.value}>{proposal.scope}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Valor</Text>
          <Text style={styles.value}>
            R$ {proposal.value.toLocaleString("pt-BR")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Prazo</Text>
          <Text style={styles.value}>{proposal.deadline}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Mensalidade</Text>
          <Text style={styles.value}>
            R$ {proposal.monthlyFee.toLocaleString("pt-BR")}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Observações</Text>
          <Text style={styles.value}>{proposal.observations}</Text>
        </View>
      </Page>
    </Document>
  );
}
