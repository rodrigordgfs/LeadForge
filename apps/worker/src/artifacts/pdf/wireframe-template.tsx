import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { WireframeResponse } from "../types.js";
import { pdfStyles } from "./styles.js";

export interface WireframeTemplateProps {
  leadName: string;
  wireframe: WireframeResponse;
}

export function WireframeTemplate({
  leadName,
  wireframe,
}: WireframeTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Wireframe do Site</Text>
        <Text style={pdfStyles.subtitle}>{leadName}</Text>

        {wireframe.pages.map((page) => (
          <View key={page.name}>
            <Text style={pdfStyles.pageName}>{page.name}</Text>
            {page.sections.map((section) => (
              <View key={`${page.name}-${section.name}`}>
                <Text style={pdfStyles.sectionName}>{section.name}</Text>
                {section.suggestedComponents.map((component) => (
                  <Text key={component} style={pdfStyles.component}>
                    • {component}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
