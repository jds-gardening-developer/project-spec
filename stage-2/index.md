**MacPlants ERP — Stage 2 Specification**

**Purpose:** Companion document to the Stage 1 spec. Captures every feature deferred from Stage 1 and the Stage 2-specific PRDs (Marketing Automation, EPOS / ERP integration, Label Printing, Volumetrics). PRD numbers mirror their Stage 1 counterparts where one exists, so each section is the "what's next" for that PRD and navigation parity is preserved between the two docs.

# **PRD-1: Plant Database & Inventory**

## **Archive Plants**

- Admin can archive plants so they do not display.

## **Low Stock Alerts**

- Set low-stock and overstock thresholds per plant variant.
- Alerts appear on the dashboard when thresholds are crossed.
- Design is agreed (per-plant manually set trigger across all pot sizes — see Stage 1 PRD-1), but implementation is deferred to Stage 2.

## **Low Stock Reporting & Automated Purchase Orders**

- Generate low-stock reports across the catalogue.
- Trigger purchase order suggestions automatically when a variant crosses its threshold, ready for an admin to review and approve.

## **"Looking Good" List**

- A dated, shareable list of plants (name, pot size, price), not linked to live stock.
- Marketing-friendly snapshot the team can email out, generated on demand.

# **PRD-1.1: Purchase Orders — Lifecycle**

## **Supplier Availability**

Allow upload of supplier availability lists (Excel/CSV). Data should be:

- Searchable
- Accessible from the internal quote builder

## **How We Know It's Done**

- Staff can upload invoice PDFs against PO records — REQUIRED?
- Supplier availability lists can be uploaded and searched within the quote builder.

# **PRD-2.1.1: Trade Customer Accounts**

## **DocuSign Onboarding**

DocuSign integration for new trade customer onboarding — automated paperwork at account creation. Deferred from Stage 1; Stage 1 captures trade accounts manually.

## **Pricing**

Support quantity-break pricing per plant variant.

Example:

- 1–4 units → £7.50
- 5–10 → £6.80
- 11–20 → £6.10
- 21+ → £5.60

**QUESTION:** Is this required? Could we implement with very basic logic to start?

## **Rebates**

Track annual qualifying spend per trade customer.

Apply rebate tiers:

- £10k → 1%
- £20k → 2%
- £30k → 3%

Tiers must be admin-configurable. **QUESTION:** Required?

- ERP calculates rebate value.
- Credit note issued via Xero.
- ERP stores reference. **QUESTION:** Required?
- Show rebate status on customer account screen. **QUESTION:** Required?

## **How We Know It's Done**

- Correct tier pricing applies automatically.
- Default price used if no tiers exist.
- Prices shown ex VAT (VAT added at total stage).
- Rebates accumulate per customer per year.
- Admin can configure rebate tiers.
- Customer-specific pricing schema exists (UI not required yet).

# **PRD-03: Order Lifecycle**

## **Orders — Invoice Phase**

- Live link for an invoice — especially important for customers who change their mind, so the invoice updates in place. Instead of a PDF.
- **Awaiting Payment:** Payment link sent out to customer. When the customer has paid, this is automatically marked as Paid and converted to Order Approved. Right now we mark an order as paid manually.

## **Cancellation Rules**

Cancellation requires:

- Reason (category + free text)
- 20% restocking fee applies if cancelled after the picking stage. *(Restocking-fee logic is deferred from Stage 1; Stage 1 records the cancellation but does not charge the fee.)*

## **Promise-Date Engine**

### **What It Is**

A system that calculates realistic fulfilment / delivery dates automatically.

### **What It Must Do**

Calculate promise date based on:

- Stock readiness (including growing & incoming stock)
- Picking time
- Staging time
- Delivery prep time

Capacity limits:

- Picking slots
- Courier capacity (DPD)
- Van space
- Pallet builds

Dispatch schedules:

- DPD cut-off (1pm)
- Pallet days
- Van routes

Rules:

- Promise date cannot be earlier than stock readiness.
- If capacity is full → move to next available day.
- Same-day collection only if:
  - Approved before 10am
  - Stock is ready
  - Capacity exists

Customer communication:

- Clear messages (e.g. "Ready Thursday after 2pm")
- Automatic notification if delayed
- Flag if later than requested

## **Rollback & Undo Tooling**

Rollback / undo tooling for user actions on orders, stock, and POs. Logging is implemented from day one in Stage 1; rollback tooling is added reactively in Stage 2 if usage shows it is needed.

# **PRD-3.1: Delivery Methods & Routing**

## **Pallet & Dutch Trolley Shipping Cost APIs**

Integrate with pallet and Dutch trolley shipping providers for automatic cost calculation. In Stage 1 these costs are added manually to the invoice.

# **PRD-04: Staff Member Tasks**

## **Purchase Order Reconciliation on PWA**

Staff can reconcile arrivals on the PWA (currently only possible on the ERP as Admin).

## **Clock In / Clock Out**

PWA clock-in / clock-out functionality for nursery staff.

# **PRD-06: EPOS Now Integration**

## **What It Is**

In Stage 1 the shop till keeps running on EPOS Now exactly as it does today. The ERP runs alongside it. The two systems are not yet plugged together — but we use Stage 1 to lay the groundwork that makes a live integration possible later.

## **How It Works Operationally**

- **At the till.** Cashier scans a barcode, EPOS handles the sale, customer pays, EPOS prints the receipt and decrements its own stock counter. Nothing changes about that experience.
- **In the ERP.** Trade orders, online orders, POs, stock takes and shrinkage all move stock in the ERP. ERP holds the true number for nursery + shop combined.
- **End of day.** Someone (Jake or shop lead) runs the EPOS daily sales report and reconciles against the ERP manually — confirming what was sold matches what should leave nursery stock. Drift gets logged so we can see how often it happens and how big. This will be done by uploading a CSV to the ERP which will update the stock accordingly.
- **Plants moving nursery → shop.** Treated as an internal "sale" / transfer in the ERP when the plants physically move, so shop stock is represented separately from nursery stock.
- **Reporting.** Three sales channels stay separate but visible in one place: trade (ERP), online (ERP), shop (EPOS daily report). No double-counting.

## **What We Need To Do Now (Preparing for the Future)**

Three things have to be in place by go-live, because Stage 2 (live integration) is impossible without them:

- **Price import.** Jake exports the ~2,900 EPOS product entries as CSV (cost, trade, retail). Josh dedupes the shop / nursery duplicates and collapses EPOS's per-pot-size product lines onto one ERP plant with multiple variants. Prices seed the ERP at go-live and get refined over the following 1–2 months.
- **One SKU, both systems.** Every plant variant gets a single ERP-generated SKU. The same SKU is written into EPOS and printed on the plant's barcode label. This is the bridge that makes Stage 2 possible — without it the two systems can't recognise the same product.
- **Barcoding from day one.** All incoming stock gets labelled with its SKU as a barcode going forward. Pre-barcoded supplier stock keeps its existing barcode — we map it to the ERP SKU.

## **How We Know Stage 1 Works**

- Every plant in the ERP has a unique SKU; the same SKU exists on the matching EPOS product and on the printed label.
- A scanned barcode in the shop returns the correct ERP plant variant.
- All ~2,900 EPOS prices are imported, deduped and assigned to the right ERP variants.
- The end-of-day reconciliation procedure is documented and someone owns it.
- Daily sales reports for the same period add up cleanly across all three channels with no double-counting.

## **What This Sets Up For Stage 2**

Once SKUs match across both systems and every plant carries a barcode, Stage 2 becomes a focused integration project: a barcode scan at the till pings the ERP to deduct stock automatically, and the ERP pushes stock changes back to EPOS so the till's figures stay honest. Josh's investigation into EPOS Now's API can run in parallel during Stage 1 — by go-live we'll know whether to integrate or to plan an EPOS replacement.

# **PRD-XX: DPD Shipping Integration**

## **What Is It**

DPD integration is fully removed from Stage 1. DPD labels, consignments, and tracking are done manually via DPD's own portal/app as Jake currently does. In Stage 1 the ERP replicates the current site's shipping cost logic so retail delivery cost is auto-calculated at checkout.

Previously: integration with DPD for parcel shipping — handling consignment creation, label printing, tracking, dispatch confirmation, and customer notification. DPD is one delivery method within the fulfilment engine, not a separate process.

## **What Stage 2 Adds**

DPD API integration to eliminate the manual copy-paste from ERP to DPD. DPD has good API documentation. Removes the per-order copy step Jake does today, and folds dispatch notifications back into the ERP's communication flow.

# **PRD-XX: Label Printing (HLS)**

## **What Is It**

Integration with HLS Pro X (Dura-ID Solutions) for printing plant labels. The ERP holds all the data — plant names, barcodes, prices, care notes — and pushes it to HLS for label printing at key moments in the nursery workflow. Pending HLS confirmation; interim Stage 1 approach is to continue using the HLS standalone software on a shared shop computer.

## **How We Know It's Done**

- The ERP can export plant label data in a format HLS can consume.
- Label data includes all required fields detailed above — different for retail and trade labels.
- Label export/sync can be triggered on demand from the ERP at any time.

# **PRD-XX: Marketing Automation**

Integrate with a marketing platform (e.g. ActiveCampaign).

ERP pushes:

- Customer events
- Order events

Integration via API / webhooks.

# **PRD-XX: Parcel Volumetrics**

Speak to packing team about dimensions / volumetrics. Get ballpark formulas for box quantities by plant size. Needed for future auto-calculation of parcels.

# **Open Items**

- **Discount Line Item** — on quotes and invoices. *(Notes incomplete in source — flesh out in next meeting.)*
