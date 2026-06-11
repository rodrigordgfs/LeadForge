import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { WireframeResponse } from "../types.js";

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
  pageName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 12,
  },
  sectionName: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 8,
  },
  component: {
    marginLeft: 12,
    marginBottom: 2,
  },
});

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
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Wireframe do Site</Text>
        <Text style={styles.subtitle}>{leadName}</Text>

        {wireframe.pages.map((page) => (
          <View key={page.name}>
            <Text style={styles.pageName}>{page.name}</Text>
            {page.sections.map((section) => (
              <View key={`${page.name}-${section.name}`}>
                <Text style={styles.sectionName}>{section.name}</Text>
                {section.suggestedComponents.map((component) => (
                  <Text key={component} style={styles.component}>
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
