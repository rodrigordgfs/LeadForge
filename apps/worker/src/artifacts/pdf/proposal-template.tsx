import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { ProposalResponse } from "../types.js";
import { pdfStyles } from "./styles.js";

export interface ProposalTemplateProps {
  leadName: string;
  proposal: ProposalResponse;
}

export function ProposalTemplate({ leadName, proposal }: ProposalTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Proposta Comercial</Text>
        <Text style={pdfStyles.subtitle}>{leadName}</Text>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.label}>Escopo</Text>
          <Text style={pdfStyles.value}>{proposal.scope}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.label}>Valor</Text>
          <Text style={pdfStyles.value}>
            R$ {proposal.value.toLocaleString("pt-BR")}
          </Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.label}>Prazo</Text>
          <Text style={pdfStyles.value}>{proposal.deadline}</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.label}>Mensalidade</Text>
          <Text style={pdfStyles.value}>
            R$ {proposal.monthlyFee.toLocaleString("pt-BR")}
          </Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.label}>Observações</Text>
          <Text style={pdfStyles.value}>{proposal.observations}</Text>
        </View>
      </Page>
    </Document>
  );
}
