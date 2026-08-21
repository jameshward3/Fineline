import Image from "next/image";
import { Check, Clock3, Palette, PackageCheck, Ruler, Scissors, Sparkles } from "lucide-react";
import type { PortalOrder } from "@/lib/portal/orders";
import styles from "./order-portal.module.css";

const PROGRESS_STEPS = ["Submitted", "Stitch review", "Production", "Complete"];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function longDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

export function OrderDashboard({ order }: { order: PortalOrder }) {
  return (
    <div className={styles.orderWorkspace}>
      <div className={styles.orderHeading}>
        <div>
          <p>Customer order</p>
          <h1>{order.designName}</h1>
          <span>{order.reference} · submitted {longDate(order.createdAt)}</span>
        </div>
        <div className={styles.orderStatus}><span /> {order.statusLabel}</div>
      </div>

      <ol className={styles.orderProgress} aria-label="Order progress">
        {PROGRESS_STEPS.map((label, index) => {
          const step = index + 1;
          const complete = step < order.progress;
          const active = step === order.progress;
          return (
            <li key={label} className={active ? styles.progressActive : complete ? styles.progressComplete : ""} aria-current={active ? "step" : undefined}>
              <span>{complete ? <Check size={12} /> : step}</span>
              <strong>{label}</strong>
            </li>
          );
        })}
      </ol>

      <div className={styles.orderGrid}>
        <div className={styles.orderDetailsColumn}>
          <section className={styles.portalCard}>
            <div className={styles.cardHeader}><span>01</span><h2>Artwork</h2><em>{order.artworkFileName}</em></div>
            <div className={styles.artworkCardBody}>
              <div className={styles.artworkImage}>
                {order.artworkUrl ? (
                  <Image src={order.artworkUrl} alt={`${order.designName} artwork`} width={560} height={380} unoptimized />
                ) : <Sparkles size={38} />}
              </div>
              <div className={styles.artworkMeta}>
                <div><Check size={15} /><span><strong>Artwork received</strong><small>The studio is reviewing stitch paths and small-detail feasibility.</small></span></div>
                <dl>
                  <div><dt>Design</dt><dd>{order.designName}</dd></div>
                  <div><dt>Colors</dt><dd>{order.colors.length || "Studio review"}</dd></div>
                  <div><dt>Source</dt><dd>{order.submittedThroughConfigurator ? "Online configurator" : "Studio order"}</dd></div>
                </dl>
              </div>
            </div>
          </section>

          <div className={styles.detailPair}>
            <section className={styles.portalCard}>
              <div className={styles.cardHeader}><span>02</span><h2>Product & placement</h2></div>
              <div className={styles.productProof} style={{ backgroundColor: order.garmentColorHex }}>
                <div className={styles.fabricLines} />
                {order.artworkUrl && <Image src={order.artworkUrl} alt="Artwork positioned on selected product" width={220} height={160} unoptimized />}
                <span>{order.placementName}</span>
              </div>
              <dl className={styles.compactDetails}>
                <div><dt><PackageCheck size={14} /> Product</dt><dd>{order.productName}</dd></div>
                <div><dt><Scissors size={14} /> Material</dt><dd>{order.productMaterial ?? order.productCategory}</dd></div>
                <div><dt><Ruler size={14} /> Finished size</dt><dd>{order.widthInches.toFixed(2)} × {order.heightInches.toFixed(2)} in</dd></div>
              </dl>
            </section>

            <section className={styles.portalCard}>
              <div className={styles.cardHeader}><span>03</span><h2>Thread & finish</h2></div>
              <div className={styles.portalThreadList}>
                {order.colors.length ? order.colors.map((color, index) => (
                  <div key={`${color.hex}-${index}`}>
                    <span style={{ backgroundColor: color.hex }} />
                    <p><strong>{color.name}</strong><small>{color.code || color.hex}</small></p>
                  </div>
                )) : <p className={styles.awaitingCopy}>Thread mapping is awaiting studio review.</p>}
              </div>
              <dl className={styles.compactDetails}>
                <div><dt><Palette size={14} /> Thread</dt><dd>{order.threadWeight.replace("W", "")} wt</dd></div>
                <div><dt><Sparkles size={14} /> Density</dt><dd>{order.densityMm.toFixed(2)} mm</dd></div>
                <div><dt><Scissors size={14} /> Edge</dt><dd>{order.borderStyle === "NONE" ? "No border" : order.borderStyle.toLowerCase()}</dd></div>
              </dl>
            </section>
          </div>

          {order.notes && (
            <section className={`${styles.portalCard} ${styles.notesCard}`}>
              <div className={styles.cardHeader}><span>04</span><h2>Notes for the atelier</h2></div>
              <p>{order.notes}</p>
            </section>
          )}
        </div>

        <aside className={styles.orderSummaryColumn}>
          <section className={`${styles.portalCard} ${styles.summaryCard}`}>
            <div className={styles.cardHeader}><h2>Order summary</h2><em>{order.reference}</em></div>
            <dl>
              <div><dt>Product</dt><dd>{order.productName}</dd></div>
              <div><dt>Placement</dt><dd>{order.placementName}</dd></div>
              <div><dt>Size</dt><dd>{order.widthInches.toFixed(2)} × {order.heightInches.toFixed(2)} in</dd></div>
              <div><dt>Thread</dt><dd>{order.colors.length} colors · {order.threadWeight.replace("W", "")} wt</dd></div>
              <div><dt>Quantity</dt><dd>{order.quantity} units</dd></div>
              <div><dt>Unit estimate</dt><dd>{money(order.unitPrice)}</dd></div>
              {order.estimatedStitches > 0 && <div><dt>Est. stitches</dt><dd>{order.estimatedStitches.toLocaleString()}</dd></div>}
            </dl>
            <div className={styles.summaryTotal}><span>Current estimate</span><strong>{money(order.total)}</strong></div>
            <p>Final pricing follows artwork, material, and sew-test review. No payment has been taken.</p>
          </section>

          <section className={`${styles.portalCard} ${styles.behindScenes}`}>
            <div className={styles.cardHeader}><h2>Behind the scenes</h2></div>
            <ol>
              <li className={order.progress >= 1 ? styles.sceneComplete : ""}><span>{order.progress > 1 ? <Check size={12} /> : <Clock3 size={12} />}</span><p>Sends to Fine Line OS<small>{order.progress > 1 ? "Complete" : "In progress"}</small></p></li>
              <li className={order.progress >= 2 ? styles.sceneComplete : ""}><span>{order.progress > 2 ? <Check size={12} /> : <Clock3 size={12} />}</span><p>Studio stitch review<small>{order.progress > 2 ? "Complete" : order.progress === 2 ? "In progress" : "Pending"}</small></p></li>
              <li className={order.progress >= 3 ? styles.sceneComplete : ""}><span>{order.progress > 3 ? <Check size={12} /> : <Clock3 size={12} />}</span><p>Production team notified<small>{order.progress > 3 ? "Complete" : order.progress === 3 ? "In progress" : "Pending"}</small></p></li>
            </ol>
            <p>Updates made by the studio appear here automatically.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
