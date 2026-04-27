## **Mac Plants ERP – Meeting Notes Summary**

These transcripts cover three planning sessions for a custom ERP replacing GrowMaster, with input from Josh (developer), David (finance/owner), and Jake (operations).

### **Order Lifecycle**

The core of the system is the quote → order flow. A quote moves through draft → sent → accepted/rejected → expired, then converts to an order with a single button click. Orders then progress through pending → confirmed → ready to pick → staged → packed → dispatched/collected → complete. Both quotes and orders can be **archived** rather than deleted (preferred over a 20% cancellation fee), preserving an audit trail.

Two distinct payment paths exist:

* **Retail customers** pay upfront via Stripe; collection orders ship within 48 hours, DPD orders within 2–7 days (packed Mondays/Wednesdays).  
* **Trade customers with credit accounts** (e.g. £10k credit) can order without paying, get invoiced 24 hours after order completion via Xero. If they exceed credit, they pay 100% upfront on Stripe.

Trade customers can specify an exact delivery date; retail uses estimated windows. Orders requested far in advance (e.g. 6 months) sit in "pending" until manually moved to confirmed.

### **Picking, Packing & Dispatch**

Jake manually assigns orders to pickers via the PWA, with separate logins for trade pickers vs. retail pickers (rather than per-person, since staff change). Orders auto-surface as "ready to pick" 1–2 days before delivery date. The dashboard view should have tabs (confirmed, ready to pick, staged, packed, dispatched) sortable by delivery date.

For packing, Jake works off the order list with DPD open in another window, manually printing labels. Pot sizes need to display so he can estimate box weights.

### **Shows & Stock Reservation**

A clever workaround: shows (Scoone, Chelsea, Tantallon, etc.) are treated as a **dummy customer order**. Stock gets reserved off the system, the order doubles as a pick list, and on return the order quantities are adjusted to reflect actual sales before being marked complete. This funnels the show revenue through normal accounting channels including cash/PayPal/card reconciliation.

### **Purchase Orders**

PO statuses: draft → requested → approved → arrived → reconciled → cancelled. Drafts replace the current spreadsheet workflow — Jake builds a wishlist with plants, pot sizes and unit cost, then sends as a PDF email. Suppliers may push back wanting their own format (e.g. Rhymebeck's spreadsheet), in which case duplication is acceptable. **Reconciliation is critical**: when stock arrives, Jake matches the physical delivery note against the PO and updates quantities \+ bed locations. This prevents staff from manually editing stock without an associated cost record.

### **Stock & Data Issues**

Current GrowMaster data is unreliable — Gavin claimed 200k plants on handover, reality was 130k, and \~34 plants show negative volumes. **A full physical stock-take is required before launch**; quantities will not be migrated from GrowMaster.

A major discovery: David has already done \~2 weeks of work in Epos containing cost price, retail price, and trade price for \~2,900 products (with duplicates between "shop" and "nursery" categories). This CSV will be exported and imported into the ERP, solving the 4,000-item "missing prices" problem.

Each plant needs a unique **SKU** that bridges ERP and Epos so till sales auto-deduct from ERP stock. Barcodes will be applied to all incoming stock going forward.

### **Shop Integration**

All shop products (plants, pots, soil, etc.) live in the ERP as the source of truth. Epos remains the till but calls the ERP via SKU to deduct stock. Online sales of non-plant items (pots, climbers) becomes possible. Selling plants online from the shop is **stage 2**.

### **User Roles & Tasks**

Three tiers: super admin (Josh \+ David, with audit log access), admin (Jake), and staff. Tasks can be created from any order (e.g. "this plant looks ill — speak to Gavin") and assigned to specific people, surfacing on their PWA.

### **Labels**

GrowMaster's label printing is the hardest thing to leave behind. Short term, Jake will manually re-enter into HLS software for shows and trade orders. Long-term integration with HLS is on the roadmap but not stage 1\.

### **Customer-Facing Features**

Trade customers see **live stock availability** in the trade portal, dramatically reducing the need for substitutions. When substitutions are needed (typically 6-month-out orders), they appear inline beneath the original line item, not as a separate notes block. A note thread between customer and Mac Plants on each quote was confirmed.

### **Other Notable Decisions**

* **Email** sent via Resend (deliverability tracking).  
* **Xero**: invoices generated in the ERP with Stripe payment links; finance reconciles payments manually rather than using Xero's built-in payment links, to keep ERP as source of truth.  
* **Looking Good list**: Jake-favoured feature — tick plants that are flowering well, generate a branded PDF, send to regular buyers like the Botanics. Simple, no stock logic attached.  
* **Low stock alerts** (stage 2): per-plant manual trigger points rather than a flat percentage, since some plants sell 500/year and others 20/year.  
* **Digital map**: beds need finer subdivision — David requested splitting each bed into \~10 sections (e.g. 1.1, 1.2, 1.3) instead of quarters.  
* **Dashboard/reporting**: deprioritised; order lifecycle and quote builder are stage 1 essentials.

  ### **Outstanding Items**

Jake will use the live ERP to test workflows and send voice notes with feedback. David will export the Epos CSV with all pricing. A sample audit of imported GrowMaster orders is needed to verify plant/pot-size mapping accuracy, with Jake cross-checking against email records for retail orders.

