# **ERP Requirements Document**

## **General Notes & Outstanding Action Items**

* **Pot Sizes:** Add pot sizes to Supplier Orders.  
* **Customer Credit Terms:**  
  * Payment terms: 30 days for everyone (hard-coded).  
  * Credit limit: differs per customer — must be adjustable.  
* **Reconcile SO:** Must be able to set stock as *reserved* against an order.  
* **Screen Review:** Need to be able to specify pot size, etc. on the relevant screen.  
  ---

  ## **PRD-01: Plant Database & Inventory**

  ### **Wastage Tracking**

* Record wastage as a **stock adjustment** (not a status change).  
* When plants die, staff log:  
  * Quantity  
  * Reason  
* Stock counts update automatically.  
* Losses are tracked per batch.  
* Users can view wastage data in a dedicated ERP window.  
* Wastage entries must:  
  * Store a reason  
  * Update both **batch quantity** and **loss count**

  ### **Stock Alerts**

* Set low-stock and overstock thresholds per plant variant.  
* Alerts appear on the dashboard when thresholds are crossed.  
  ---

DISCUSS — Weight does not need to be stored per plant. Weight is calculated from pot size (1 litre ≈ 1 kilo, dry weight approximation — accepted as good enough for DPD cost estimation). This is only needed for DPD cost calculation and does not need to be exact.


DISCUSS — Required? Stage 2? Plant height is valuable data (used for substitution suggestions later) but dimensions are seasonally variable.

  ## **PRD-02: Suppliers & Purchase Orders**

  ### **Supplier Availability**

* Allow upload of supplier availability lists (Excel/CSV).  
* Data should be:  
  * Searchable  
  * Accessible from the internal quote builder

  ### **How We Know It's Done**

* Staff can upload invoice PDFs against PO records — **REQUIRED?**  
* Supplier availability lists can be uploaded and searched within the quote builder.  
  ---

  ## **PRD-04: Trade Pricing & Rebates**

  ### **What Is It**

The pricing engine for trade customers:

* Prices per plant variant (not per order)  
* Quantity-break tiers (bulk discounts)  
* Annual spend-based rebate scheme

  ### **Pricing**

* Support quantity-break pricing per plant variant.  
* Example:  
  * 1–4 units → £7.50  
  * 5–10 → £6.80  
  * 11–20 → £6.10  
  * 21+ → £5.60  
* **QUESTION:** Is this required? Could we implement with very basic logic to start?

  ### **Rebates**

* Track annual qualifying spend per trade customer.  
* Apply rebate tiers:  
  * £10k → 1%  
  * £20k → 2%  
  * £30k → 3%  
* Tiers must be admin-configurable.  
* **QUESTION:** Required?  
* ERP calculates rebate value.  
* Credit note issued via Xero.  
* ERP stores reference.  
* **QUESTION:** Required?  
* Show rebate status on customer account screen.  
* **QUESTION:** Required?

  ### **How We Know It's Done**

* Correct tier pricing applies automatically.  
* Default price used if no tiers exist.  
* Prices shown ex VAT (VAT added at total stage).  
* Rebates accumulate per customer per year.  
* Admin can configure rebate tiers.  
* Customer-specific pricing schema exists (UI not required yet).  
  ---

  ## **PRD-05: Trade Portal & Quote Builder**

  ### **Requirements**

* Internal quote builder includes:  
  * Supplier availability  
  * Margin controls  
  * Full stock visibility  
* When reviewing trade quotes, staff can see supplier availability inline.  
  ---

  ## **PRD-06: Orders, Fulfilment & Operations**

  ### **Orders — Invoice Phase**

* **Awaiting Payment:** Payment link sent out to customer. When the customer has paid, this is **automatically** marked as Paid and converted to *Order Approved* (integration with Xero).  
* The customer is sent a live link to view the invoice (see live-link flow below).

  ### **Cancellation Rules**

* Cancellation requires:  
  * Reason (category \+ free text)  
* 20% restocking fee applies if cancelled after the picking stage.

  ### **Promise-Date Engine**

**What It Is:** A system that calculates realistic fulfilment/delivery dates automatically.

**What It Must Do:**

* Calculate promise date based on:  
  * Stock readiness (including growing & incoming stock)  
  * Picking time  
  * Staging time  
  * Delivery prep time  
* Capacity limits:  
  * Picking slots  
  * Courier capacity (DPD)  
  * Van space  
  * Pallet builds  
* Dispatch schedules:  
  * DPD cut-off (1pm)  
  * Pallet days  
  * Van routes  
* Rules:  
  * Promise date cannot be earlier than stock readiness.  
  * If capacity is full → move to next available day.  
  * Same-day collection only if:  
    * Approved before 10am  
    * Stock is ready  
    * Capacity exists  
* Customer communication:  
  * Clear messages (e.g. "Ready Thursday after 2pm")  
  * Automatic notification if delayed  
  * Flag if later than requested

  ---

  ## **PRD-07: Payments & Invoicing (Stage 1\)**

  ### **Overview**

* Payments via:  
  * Stripe (card)  
  * GoCardless (Direct Debit via Xero)  
* ERP does **NOT** store card details.

  ### **Stage 1 Decision**

* Full payment system is **NOT required** for Stage 1\.

  ### **Interim Process**

**To-Do List for Arian:** Create a manual To-Do system for replicating invoices in Xero from the ERP.

### **Requirements**

* Invoice replication:  
  * Can be a single line (e.g. £1100)  
  * Xero handles payments  
* If customer does not exist in Xero, they must be created.

  ### **How We Know It's Done**

* Completed order invoices are pushed to Xero (manual for now).  
  ---

  ## **PRD-08: Payments (Stripe \+ Basic Xero)**

* Not required for Stage 1\.  
* If there is scope to push these to Xero with 1 line item, that would be fantastic — however, this can be done manually for now.  
  ---

  ## **PRD-09: DPD Shipping Integration**

  ### **What Is It**

DPD integration is fully **REMOVED from Stage 1**. This was confirmed in the meeting as a major scope reduction. DPD labels, consignments, and tracking will continue to be done manually via DPD's own portal/app as Jake currently does.

*Previously:* Integration with DPD for parcel shipping — handling consignment creation, label printing, tracking, dispatch confirmation, and customer notification. DPD is one delivery method within the fulfilment engine, not a separate process.

### **What It Must Do (Stage 1\)**

* The ERP stores the order number which Jake manually enters into DPD's own portal/app.  
* DPD dispatch notifications come from DPD directly to the customer — the ERP does not need to send dispatch emails.  
* Jake continues to manually copy customer name, address, and postcode from ERP into the DPD portal (DPD auto-fills most fields from postcode).  
* Delivery cost for retail is auto-calculated using the existing website logic (carried over from current site). This logic is tried and tested.  
* For trade orders, delivery cost is added manually to the invoice.  
* **Stage 2 consideration:** DPD API integration to eliminate the manual copy-paste from ERP to DPD. DPD has good API documentation.

  ### **How We Know It's Done**

* ERP Order Number is visible and easy to copy for entry into DPD system.  
* Retail delivery cost is auto-calculated at checkout using existing logic.  
  ---

  ## **PRD-10: Label Printing (HLS) — REQUIRED?**

**THIS MAY NOT BE NEEDED — ARIAN TO CHECK**

### **What Is It**

Integration with HLS Pro X (Dura-ID Solutions) for printing plant labels. The ERP holds all the data — plant names, barcodes, prices, care notes — and pushes it to HLS for label printing at key moments in the nursery workflow.

### **What It Must Do**

* **ACTION ITEM (BLOCKER):** Josh/Arien to confirm with HLS/Dura-ID that HLS can be separated from GrowMaster and operate independently with data from the ERP.  
  * If confirmed: GrowMaster can be fully retired.  
  * If not: this becomes a high-priority integration.  
  * Josh is back Friday — Sigurd to follow up.  
* Push plant label data from the ERP to HLS via direct SQL sync or CSV export (approach depends on coordination with Dura-ID).  
* Label data includes: plant name, botanical name, pot size, SKU/barcode, price (ex and inc VAT), batch ID, ready date, care notes, and a QR code linking back to the ERP.  
* Labels are printed at:  
  * Order picking (pick labels)  
  * Retail stock preparation (price labels)  
* **Note:** Retail labels and trade labels are different.  
  * **Retail labels** contain: Name, description, care info, price.  
  * **Trade labels** contain: Name, description, care info, Plant Passport.  
* Label export/sync must be triggerable from the ERP **on demand** — not only on a schedule.

  ### **How We Know It's Done**

* The ERP can export plant label data in a format HLS can consume.  
* Label data includes all required fields detailed above — different for Retail & Trade Labels.  
* Label export/sync can be triggered on demand from the ERP **always**.  
  ---

  ## **PWA (Progressive Web App)**

  ### **Purchase Order Incoming**

* Staff can reconcile arrivals on PWA (currently only possible on ERP as ADMIN).

  ### **Requirements**

* Clock in / Clock out functionality.  
  ---

  ## **Stage 2**

  ### **Marketing Automation**

* Integrate with platform (e.g. ActiveCampaign).  
* ERP pushes:  
  * Customer events  
  * Order events  
* Integration via API/webhooks.  
    
  