import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { brand } from "@/lib/branding";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1A1A1A" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  brandName: { fontSize: 14, fontWeight: 700 },
  brandSub: { fontSize: 8, color: "#666666", marginTop: 2 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#444444" },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 10, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 120, color: "#666666" },
  value: { flex: 1, fontWeight: 700 },
  thumbnail: { width: 140, height: 140, objectFit: "contain", border: "1pt solid #DDDDDD" },
  colorRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, borderBottom: "0.5pt solid #EEEEEE", paddingBottom: 4 },
  swatch: { width: 14, height: 14, marginRight: 8, border: "0.5pt solid #00000033" },
  seq: { width: 18, color: "#999999" },
  colorName: { flex: 1 },
  colorMeta: { width: 140, color: "#666666" },
  footer: { position: "absolute", bottom: 24, left: 32, right: 32, fontSize: 7, color: "#999999", textAlign: "center" },
});

export interface PdfColorRow {
  sequence: number;
  hex: string;
  companyName: string;
  manufacturer: string | null;
  threadCode: string | null;
  needleNumber: number | null;
}

export interface PdfInput {
  designName: string;
  designId: string;
  revision: number;
  widthInches: number;
  heightInches: number;
  colors: PdfColorRow[];
  product: string | null;
  location: string | null;
  hoop: string | null;
  stabilizer: string | null;
  setupNotes: string | null;
  productionNotes: string | null;
  thumbnailDataUri: string | null;
}

export function ProductionSheetDocument(input: PdfInput) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandName}>{brand.companyName}</Text>
            <Text style={styles.brandSub}>{brand.productName} — {brand.productSubtitle}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: "#666666" }}>Design ID: {input.designId}</Text>
            <Text style={{ fontSize: 8, color: "#666666" }}>Revision V{input.revision}</Text>
          </View>
        </View>

        <Text style={styles.title}>{input.designName}</Text>
        <Text style={styles.subtitle}>
          Production Sheet · {input.widthInches.toFixed(2)}&quot; × {input.heightInches.toFixed(2)}&quot; · {input.colors.length} colors
        </Text>

        <View style={{ flexDirection: "row", marginTop: 16 }}>
          {input.thumbnailDataUri && <Image src={input.thumbnailDataUri} style={styles.thumbnail} />}

          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={styles.sectionTitle}>Production</Text>
            <Row label="Product" value={input.product ?? "—"} />
            <Row label="Placement" value={input.location ?? "—"} />
            <Row label="Hoop" value={input.hoop ?? "—"} />
            <Row label="Stabilizer" value={input.stabilizer ?? "—"} />
            <Row label="Width" value={`${input.widthInches.toFixed(2)}"`} />
            <Row label="Height" value={`${input.heightInches.toFixed(2)}"`} />
            <Row label="Color Count" value={String(input.colors.length)} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thread Color Sequence</Text>
          {input.colors.map((c) => (
            <View key={c.sequence} style={styles.colorRow}>
              <Text style={styles.seq}>{String(c.sequence).padStart(2, "0")}</Text>
              <View style={[styles.swatch, { backgroundColor: c.hex }]} />
              <Text style={styles.colorName}>{c.companyName}</Text>
              <Text style={styles.colorMeta}>
                {c.manufacturer} {c.threadCode}
              </Text>
              <Text style={{ width: 70, color: "#666666" }}>
                {c.needleNumber != null ? `Needle ${c.needleNumber}` : "Unassigned"}
              </Text>
            </View>
          ))}
        </View>

        {(input.setupNotes || input.productionNotes) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            {input.setupNotes && <Text style={{ marginBottom: 4 }}>Setup: {input.setupNotes}</Text>}
            {input.productionNotes && <Text>Production: {input.productionNotes}</Text>}
          </View>
        )}

        <Text style={styles.footer} fixed>
          {brand.export.productionSheetFooter}
        </Text>
      </Page>
    </Document>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
