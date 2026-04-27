# **Mac Plants ERP Project — Meeting Transcript (Cleaned)**

*Speakers appear to include Josh (developer building the ERP), Jake (admin/operations), David (owner/manager), and Ariane. Where attribution is unclear, lines are left unattributed.*

---

## **Part 1 — Prototype Walkthrough, Order Lifecycle, Shows, Picking & Packing**

**Josh:** A lot has happened since we last spoke. We now have a prototype that's much closer to what you'll actually be using. Invoices won't be in here yet, but you'll have dashboards — that's not the most important thing. We've got plants — these are real plants now, actual data — customers, and we've uploaded the orders too. I'll be chatting to Aaron about that, but what I want to talk to you about is the prototype. It's not real yet, but this is what it's going to be like. We'll have quotes here.

The big thing is the order lifecycle. There's a big diagram, and it's going to be very important to you. An order will go through two stages: quote and order. You have to convert from one to the other — unless you're a retail customer.

**Jake/David:** Trade customers can also purchase without getting a quote, if the stock is available — which Josh wanted.

**Josh:** I didn't mean it like that. I meant: currently in GrowMaster, once you're in stage one, you spend all your time setting up the quote. The customer might edit it, but once you've made your edits, can you click "convert to order"?

**Jake:** Yes.

**Josh:** Good — so that's automatic. Here's how it'll actually work: a quote will go through these stages — draft (you can still edit it, edit a line, edit a plant, change the pot size, save changes), then approve quote (it's been sent and approved). Then this button will say "convert to order" — the invoice stage happens on the other side. So it goes from quote to live order with a single click, and then it picks stage packs, this magical thing.

So we're trying to account for all scenarios here. Another important point: trade portal customers can request a quote. Customer requests a quote → quote awaiting response (that would be a task for you to do) → quote sent to customer. Then they respond, and it goes back through the cycle. We want it so that when a customer requests a quote, you can edit line items, add a note at the bottom — every quote and order should have a note option.

**Jake:** That note needs to be visible to customers.

**Josh:** Yes, exactly. So how does this look as a first impression?

**Jake:** It's good.

**Josh:** Anything you obviously need to have?

**Jake:** Well, in GrowMaster when you're doing quotes, every plant you click on gives you live information on how many you have of that plant. Is there something like that here?

**Josh:** Yes — we need to have live availability when you're adding it. That might also be good for the customer to see on their end.

**Jake:** The trade customers will actually have that on their portal — currently they can see a live feed in their own space.

**Josh:** Right. So in the back end as well, availability is shown — like a quote builder. When you create a new quote, you select your customer, select your delivery method, then create line items. Once you're done, you save or send. We can't actually do that right now because it's a prototype, but if you click send, it would change to status "sent" and you'd be awaiting a response.

This is probably quite important — delivery method, order lifecycle. These are all the statuses things can have. A quote could be a draft (because you might make it and not send it), it could be sent (you sent it to the customer)…

— *\[brief internet drop\]* —

**Josh:** We also have a comment section for every quote, so you can say something.

**Jake:** Yes — like a note section. Is that internal for Mac Plants, or between customer and Mac Plants?

**Josh:** Between customer and Mac Plants for the quote.

**Jake:** Yes, definitely. We had that conversation last time.

**Josh:** I'll put it in. It was in my head but didn't make it into the frame.

**Jake:** How Jorber currently does it: I have a button called "request a change," and it's done through email — when we send via email, a private email. I don't know what's easier — is it going to cost a lot more to build a chat function, or do you just bolt it onto email so you send it back and forwards?

**Josh:** Or, you have "changes requested," and when you tap it, it gets noted on the quote. When you want to get back to it, you can enter an email from there, resend it — but it's all logged in the system.

**David:** I thought we were doing it so that you can amend the quote and it just scores a line out. Both parties can see what's been changed and amended from the original quote — that's what Jorber does.

**Josh:** Yes, that's still happening. I think we were chatting about a chat function here.

**David:** No, it won't be a chat feature. It's more that you send the invoice and there's a note attached. It's email-based, and when we want to send an email it'll come up with a modal with a pre-written "Dear customer, please find attached your quote." At that point you can write "I've substituted this plant for that plant," and if that's okay, great; if not, then the customer can accept line items individually — they don't have to accept the whole thing.

**Jake:** How it works in GrowMaster: every line item gives you the option to put a note. So let's say you type in "Crocosmia Lucifer" but you haven't got that, so you've substituted — it gives you that option on each line. On the actual lined invoice it would say directly underneath: "substituted for whatever." If there's just one note box at the bottom, it might be more confusing.

**Josh:** That's a fair point — and GrowMaster does it well. It can be like a note underneath the line — "substituted for…"

**Jake:** Yes. So when the customer requests a quote for the first time, they say what they want, then you send it back…

**Josh:** Walk me through how it looks in GrowMaster.

**Jake:** Firstly you fill out the initial form: billing address, delivery address, email address, all that. The second section is "add line items." It comes up with a database of all the plants and you enter them by code. Say you type "CRO LUC" — that would be Crocosmia Lucifer. It will tell you how many you've got in stock and how many have been saved for another order, so effectively it shows your saleable stock. If your saleable stock is under what they wanted, you'd go out and type in, say, Crocosmia "George Davidson" — type "CRO GEO" — see you've got that available, click 25, then in the notes section type "sub for Crocosmia Lucifer." It highlights that it's a substitution and what it was for, right on that line.

**Josh:** If we're giving customers visibility of availability, we wouldn't need to do that — they can't place an order for a plant that's not in stock. They'd see a live feed of what's in our shop.

**Jake:** They wouldn't get a substitute because they can't place the order. The only time would be for plants if they're putting in an order for six months down the line and you know you don't have it currently — that's the only time we'd substitute things.

**Josh:** So substitutions will be much rarer.

**David:** That's if we're doing the live availability list for both parties.

**Josh:** It's good functionality, but how much time is it going to take? Well — we're already going to be giving the user a number of how many plants there are. There are 100 of this plant, 200 of that. They'll know exactly how much. There's also going to be the special plants logic — for things like the Meconopsis, Gavin had put logic so customers can't just go and buy them all.

**Jake:** With Meconopsis, say we've got 100 and we need to keep 15 for propagation and 30 back for shows — we'd only ever have available stock as to what we can sell. But the thing with Meconopsis is, they're full retail price. Some stock is never going to be at trade price; it's always going to be retail price. So if they want to buy 50, we can only sell what we've got, but they can buy as many as they want. As long as we've got enough for shows and propagation, it doesn't matter — if we sell quickly, surely that's better for us.

**Josh:** Can we put a minimum — like we'll always have 10 of each plant in the nursery we can't sell?

**Jake:** How we do it now: all the Meconopsis out there in two-litre pots, they're not for sale, so they never get entered into stock.

**Josh:** Right — so if they're not on the system, that's fine. We could have them on the system if you want, as the status is "trade ready," "retail ready," "growing."

**Jake:** I think we said no to that — to the live availability — Kyle said no.

### **Shows and stock movement**

**Jake:** There's another thing — about the shows and how we're going to adjust stock for the shows. You have to literally rip up the stock from the nursery that you're taking to the show, then do a stock take. I mean, you sell it to a customer called "show" — when it goes in the van, you sell it to the show.

**Josh:** Sell it to the pack? Bag? Purchase it as you?

**David:** No, but that wouldn't be good for your revenue.

**Josh:** No — but for example with Schoon, it takes two days to prepare for it. You want to rip out inventory or stock to prepare for that, and you have to tell the system not to adjust the stock value — or maybe to adjust it. Essentially you're reserving stock. You could just create a fake order for a fake customer.

**Jake:** That works because the show plants are like the "trim" — what you have to get.

**David:** What about something on the app — because this would work for the shop as well — where you have movement from nursery to shop, and movement from nursery to show. It basically sits in a holding area, not sold and not available in the nursery. Once the show is over, you can say we sold 75% of that stock, put 25% back into nursery. With the shop you could do the same — once that flowering period is gone, you can say we sold 75%, 25% goes back. You could check what had sold or adjust the numbers and put it back into stock. That way it's not available for sale on the web or in the shop. When it comes back, with a click of a button you change the numbers and put it back into stock.

**Josh:** I think that should work, especially with the shop.

**David:** It would essentially create a sale between shop and nursery. The shop has its own stock inventory management on EPOS, and we track sales through there. But — well, we were talking about that.

**Josh:** Yes — basically what we think we can do is, because the trickier bit is the pots and climbers and shrubs we want to sell online as well, not just in the shop. The shop currently uses EPOS, but the website is going to work off the ERP. So we think we'll have all the stock for everything, including the shop, on the ERP. When you sell items through EPOS, the barcode and the plant ID or Mac ID or SKU will connect, and it will deduct from the stock on the ERP.

**David:** Much better. Cleaner.

**Josh:** The key point: we need an ID number, an SKU, in both the ERP and EPOS, so we can send a request from EPOS saying "this product ID has been sold, this quantity, remove it."

**David:** Perfect. I'm all for it.

**Josh:** So — we're going to advance with barcodes?

**David:** Well, the barcodes change. This is going to be an SKU number — the product ID number.

**Jake:** Yes, it'll be unique.

**Josh:** Our ID — Mac Plants' ID? Not anyone else's?

**Jake:** No, no — it's our own unique identifier number on our site. But the barcodes are unique too — each product will be unique. Westcombe's ones change — they change barcodes every year. After all the shop staff aren't going to use their pre-cut barcodes anymore; we're going to use our own from now on.

**David:** Effectively, anything that comes in we're going to barcode and stick on these.

**Jake:** Anything. The other whole issue where you know Clare bought a load of plants and put the wrong prices on them, pre-stuck on labels, and then we uplifted prices and there was a whole drama before the opening where the uplift hadn't gone through…

**David:** Whose fault was it?

**Jake:** Not my fault. *(laughter)*

**Josh:** Do you want to add a status called "show"?

**Jake:** Yes, that would be good — or even something like "reserved." But "show" is good, because anyway coming up the nose is the show. Yes, because that means status growing, on a plant we can't sell, we just add the status "reserved." We can reserve plants, but to reserve it you need to create an order…

**Josh:** You'd create a dummy customer.

**Jake:** Because it's an easy thing to do — we just literally add a status. We build a show tracker as well.

**Josh:** No, because it's plants in, plants out, and revenue is generally calculated from that — from that stock and the mini stock-take from the show — the in and out, what the system calculates the sale to be, and what we actually received.

**David:** The way I see it happening: once we know the full calendar of what we expect to sell at all the shows, if we had a section called "show," we could buy in more stock to allow for sales for those shows. But it would be good if a section of the site could make a list of what you want picked for the show — and also take that stuff out of general stock. And like I said about putting it back into stock after, it would make it quicker. You could have an interface where you print off a picking list for the show, and we'd know what gets picked, what's getting taken. So we have a record of how much stock goes to the show, what sold, what didn't sell, and how much money we should have for that.

**Jake:** You know how you were talking about having a "shop" button? I'd have a "show" button, and then you can add the shows that we're going to be doing. Schoon, Powis, per show. Then you can start assigning plans of what about the shows. Do a stock take before it goes to the show — that's what went out. Because at a show you're just taking cash, you're not going to have time to do a whole scan and see what's wrong because it's so busy. What went out, what came back in, and then move it all back out — because it's all contained.

For Schoon, it's about four weeks of work for one person to get that show pass — show garden, all the plants ready. So it's actually quite a part of the business. Next year we want to do Chelsea, we want to do Tan — but we're not just next year.

**David:** We're doing it.

**Jake:** What he was saying — that guy who came in — is that every year they lose quite a lot of money on Chelsea. It costs a lot to do.

**Josh:** It's marketing.

**Jake:** And it's in the middle of May, which is — anyway. Recording's not… *(laughter)* I just want to make sure that sometimes it goes on. But actually, because it's a big part of the business, we want to make sure we're discussing it properly — how we grow them on differently, how we get them ready, and how we actually track the sale. I'm not too bothered about the sales side because all we really want is stock movement between shows.

**Josh:** Yes — because it's going to be quite, it could be possible to link that into the cash too, and I'll do that all in the background, the whole Xero thing. But stop on Mac. What goes in the van? What comes back?

**Jake:** I've got a meeting with Gavin today regarding Schoon. I've asked him to make me a list of what stock we should prepare and take to Schoon — that's our biggest show. It would be good if there was something where we can just move stock immediately into the show. Next year, let's just say we're all hit by a bus — next year, we want to see how many plants they took to the show, how much sold; if we sold out of one specific plant we might take more of that one.

**Josh:** Quick question — the shows are all during the summer, right? It's not — what's the start date? Because by the time we finish this it'll be July, August. They'll all be finished. So we'll have six months to prepare. I was thinking about stage one — if we're going live in July, we might still have shows we want to reserve stock for.

**Jake:** You'll want to start doing farmers' markets and local shows.

**Josh:** Okay, so this is more of a stock side. You'd love to do mass insurance, but you've got to do small farmers' markets. Unless — you do create a dummy quote and it reserves it. Then when you come back from the show, you delete the quote and adjust the stock manually.

**Jake:** I mean, we can explore that.

**Josh:** You create a quote, you create an order which reserves the stock — which is what you want. The stock is now not online, not available for trade. Then you have your order, you take it to the show, and when you return, you see the order. At that point you go: this is the order, this is how much we took, this is how much we have now. Then you cancel and adjust stock manually for the things you've sold. Because for a cancelled order, there will be a flow already — like, if a customer makes a quote and for whatever reason it's cancelled, that already exists.

**David:** Okay — so you could just put all the show stuff into a quote, it gets removed off stock, and when you come back, you adjust the quote numbers to what you sold and didn't sell, and what you sold to Schoon Palace.

**Josh:** Can you cancel an order?

**Jake:** Yes — if you cancel the order, the stock just goes back to the original.

**David:** No — but you want someone to track the sale of those. So you make a quote of everything you want, that creates a pending order, but before you complete the order, you adjust the numbers for what you're doing. That'll create a sale of those.

**Josh:** When you create a quote, it doesn't reserve the stock. The stock gets reserved when it's converted to an order.

**Jake:** So it can be a pending order — a pick list — that goes in the van, and you don't put it to the completion stage until then. You can edit the numbers.

**Josh:** A pending order is a live order and the stock is reserved. But "pending order" right now is only for a customer that's requested plants to be delivered in two months, or the plants have gone out of stock.

**Jake:** It's better that it's a pending order rather than a completed order, from the perspective that we're going to have to edit those numbers when we come back, because we're not going to sell everything every time. Will that work?

**Josh:** You can edit the numbers afterwards, when you come back. You'd want to give it a credit and that adjusts it back. But it's not going to the invoice stage — there's nothing financial about it. It's literally just stock movement, because we're not invoicing anyone. We'll be cancelling that order before it hits the invoice stage.

**David:** The core thing is you want the stock to be reserved — not available online — but then put back easily.

**Jake:** There'll be a lot of plants to come back. Hopefully not — you've only got to take what comes back.

**Josh:** So you want stock not to be available online, and a task to put stock back. I imagine when you go to a show, you generate a pick list. Right now this system is a sales machine for online and quotes, and part of the order stage is the pick list — the pick list goes to the app. But when you go to a show, do you generate a pick list?

**Jake:** We don't create a specific one. Up until now, Gavin, Beryl and Claire — all of whom are now gone — go around and pick what looks the best of things they know will sell well. That's it; there's no thought given. We will need it because we don't want to have to do all that ourselves. We need to be able to create a list that needs to be picked. They might not get everything off the list, but they go and pick a pre-assigned set of plants. That's partly what today's about — going to see Gavin. We'll be able to print that off, say "that's what we need picking." They go and pick it, separate it, and prepare it for the show.

**Josh:** How I see it working — probably the easiest way:

**Jake:** You create a fake order to Mac Plants of whatever you've ripped off the stock. So you've essentially reserved that stock off the system. When you come back, you cancel the order, so the stock goes back into the system — the exact same things you've taken go back. Then you'd do one big bulk stock take, label it with the show name, and then you'd only put in the adjustments from the initial order — what you've taken, sold and brought back. That way I can see tracking it. That stock take is just for the trade show.

**Josh:** Why don't we create an order that is — we can give an order a name — and the order name is the trade show? You take the stock you need for that trade show, and when you come back, you've sold 75%; you adjust the order to reflect that. So the order is how many plants you sold at that trade show. The trade show is just one giant order.

**David:** That's the way to do it. And on the cash side — that will raise an invoice if you go right to the end. It could just be marked as paid.

**Josh:** Right.

**David:** Yes — pay the public, PayPal transaction, cash transaction, and that will then show all the sales.

**Josh:** Yes — in fact, do it. Ping it through as an invoice. Treat it like a normal customer.

**David:** That normal customer was basically 100 customers.

**Josh:** Yes.

**Jake:** And then you've got cash terminal, PayPal, and cash. But there's also cash you've got to bank — that's my problem, don't worry about that. As long as it goes through normal channels, I like it. That's a really good solution actually.

**Josh:** And we're not disgusted, but for example — is there a button to print off an order from the ERP?

**Jake:** There's not a print button. There's a "download as PDF."

**David:** Then you could print that — you're on a computer, so you could print a PDF.

**Josh:** Yes — like in Jorber, you can just print off a quote and it comes up nicely.

**David:** With the header and all that. So if Jake wants to print off something for the show, he'll have a nice spec. A bit of paper will be handy.

**Jake:** Well, if we've got a picking list for the show, could it not operate the same way as a picking list does for orders? It would still tell the staff: "this on this bed, that on that bed." A bit of paper just to mark each one off. It still goes through the PDF.

**Josh:** Yes — for reporting, you'll be able to pull orders and quotes out as PDFs.

**Jake:** Every order can be downloaded as a PDF? You can generate an invoice from an order — and you can generate multiple invoices from one order if the order changes.

**Josh:** Really? Awesome. Wow, okay, that was a good question.

### **Picking lists and task assignment**

**Josh:** About picking lists — right now, I've got you down as manually assigning. Tasks are going to be very, very important. All these tasks come in and it's up to you to assign tasks to people. You can create tasks from an order — "speak to Gavin about this plant" — tasks attached to the order. For example, on any order you can create a note or a task. This specific order, this plant is ill — you add a task: "need to take plant to doctor." Description, date, assigned to whoever knows about that plant, linked to this specific order. Then it appears here in your task management system.

You can assign tasks. If you want to see your tasks for the day, you go here, you see what you need to do.

**Jake:** How will this link to the individual staff members? Through their phone?

**Josh:** Yes — through the PWA.

**Jake:** The only thing — if it's so interactive on the phone, are we going to need to provide iPads so it's not on their phones? Sometimes you do get pushback if people aren't so phone-orientated.

**Josh:** The PWA — it's not a heavy app, it's a progressive web app. It will require internet because it's a PWA, but it's not going to drain a battery.

**Jake:** It's the kind of thing that if you're running it all day it can drain your battery.

**Josh:** I mean it's not heavy.

**Jake:** Particularly for the pickers, because at any one time — it's fine for the nursery workers, because their adjustments are quick: they're working on one line of plants, halve the number because of disease, change the number because they've split into different sizes — that's quick. But for the pickers, their whole day is going around picking plants. At that point you might have two iPads, and those two iPads are responsible for picking. The bulk of their work would be on iPads, and that's why you might want it tied to an iPad rather than a specific person. The person might change — say someone calls in sick, someone else needs to jump on the iPad.

**Josh:** That's a good idea.

**Jake:** It doesn't matter which Mac. We're really allocating to a login.

**Josh:** It doesn't need to be an iPad — it could be an iPod touch, an old phone, because you only have one Mac. "Picker 1 login," etc. Instead of buying iPads, just log in on your own phone under a new username.

**David:** We can buy that.

**Josh:** Anyway — yes, you'll be assigning people to pick certain plants. I don't know if that's useful — for you to have oversight: "these are the plants, these are the orders coming in."

**Jake:** It would be good from the perspective of: we've got trade pickers and retail pickers. So Vicky's a trade picker, Lindsey's the retail picker. I can send the trade orders to Vicky and the retail to Lindsey.

**Josh:** Perfect — that's what I wanted to know.

### **Order statuses and the daily dashboard**

**Josh:** Orders will go to "ready to pick" the day before. For something to have that status — this is a key moment in the order lifecycle — you have "pending," then "confirmed" (the customer has paid, customer sent order confirmation, they get a delivery date). Then "ready to pick" when the delivery date is three or four days out. Do you want to manually do that, or do you want it automated? Right now on an order, this is the wrong tab… we've got an order that is approved or live.

**Jake:** Is this for retail orders specifically, or trade?

**Josh:** Both.

**Jake:** With trade, they don't pay at that last stage — they pay after.

**Josh:** Yes, there's a flow for that. But I think it needs to be variable. It's better if it doesn't automatically tell them when their delivery is going to take place, because it would depend on orders sitting in pending — you can only work through so many. We say on the website at the moment something like "we will fulfil the order within 10 days." We need that flexibility for very busy periods, because it'll take longer to get orders out. So an estimated delivery date would be better, with a clause saying "during busy periods it might not be."

**Josh:** How do you decide what to pick today?

**Jake:** I just work from the bottom of the list sequentially. They're all dated; the newest are at the top. I've got a red box when it's been printed for picking, and a green box when it's been packed and gone out. Click on the email — red box, green box. Oldest to newest, sequentially up from the bottom. But if they've got two boxes that have been sent and then back down…

**Josh:** Could you add an extra box where you can put in the delivery date?

**Jake:** Yes — we'd have the generic out, "roughly two weeks," but then you could put a specific date.

**Josh:** Eventually we won't forget. You buy a chef's pair, pick it up over there, you get it on that day…

**Jake:** Then the system will just realign the orders into priority of what needs picking next.

**Josh:** Yes — that's what I want to know. What kind of interface do you want to see for this? We're going to have 50 live orders, but we can't ship 50 today — we can only do 25\. So you need to pick 25 orders that go to "ready to pick." Once they're ready to pick, that's when you print labels. In the office, you'll have your orders all with different statuses. There would be a status "confirmed" — those are orders the customer has paid for and are expecting. "Ready to pick" is what we'll do today, and you assign a picker. From a glance: "okay, today this is what we'll pick."

You've got your orders, just little tabs — you can see okay, eight orders in total: three ready to pick, two staged ready to pack, one packed. Dispatched — we don't need that here, but it's good to know. Dispatched in the last 24 hours, complete in the last — that would be historical. From a glance: orders, what do we have today?

**Jake:** Ready to pick — if you're having that delivery system and people want a specific date, can we sort them? You could sort them by delivery date.

**Josh:** Yes — perfect.

**Jake:** Or the system does it itself. It goes top — because our brain goes to the top one first.

**Josh:** The system will auto-formulate by next delivery date. We can sort by delivery date.

**Jake:** Okay.

**Josh:** I'm really glad this is recording — there's so much information.

**Jake:** Yes, this is what's going to make it good. You come in in the morning, look at "ready to pick," live — there's a big difference between a confirmed order and ready to pick. Confirmed is a to-do, in the pipeline. Ready to pick is "today." Yes, exactly — and there needs to be an easy way to have a bird's-eye view. These tabs are pretty good.

**Josh:** Brilliant. And that shows you all the orders. Once it's complete, we'll just archive — you can search for it. But on here, this is your order dashboard. Ready to pick is a to-do for today, confirmed is a to-do for the next two-three days, staged is a to-do for today, packed means we've done our work, we're waiting for DPD or for them to collect. Does that sound good? Are you happy?

**Jake:** Yes.

**Josh:** Awesome — that's the most difficult thing.

### **Purchase orders**

**Josh:** Supplier orders — we'll call them "purchase orders." Is that a better name than supplier orders? I had named them supplier orders; I'm going to change that.

These can have multiple statuses. Drafts, requested, accepted, arrived, reconciled (very important), and cancelled. Obviously this is for buying in stock. Another thing: in the morning you can come in and see "okay, these are two drafts I need to finish off; these are ones I've requested and they haven't replied — I need to call them; these are approved, so they're incoming; expected delivery date and arrived" — that's another to-do. Cancelled, for whatever reason.

You go into one — say a draft. There's a stepper because for a successful purchase order, it needs to go through these stages, from draft to requested. You've got a button "send to supplier."

**Jake:** So this is where you draft your wishlist — without using their avenues? Their spreadsheets?

**Josh:** Exactly. Right now this isn't set up properly — we need to think about it.

**Jake:** When you create this — you're going to order plants that are in your database. How often do you order something you don't have at all?

**Jake:** We will order stuff we don't have in stock or haven't stocked before — they breed new varieties of plants quite regularly.

**Josh:** Right now you've got GrowMaster with 6,000 plants. Say you want a plant that's not in there — do you write an email saying "I want this plant," or…?

**David:** Basically there are two ways suppliers work at the moment. One: they've got an online spreadsheet system with all their plants. You write next to it multiples of 12 you want — 36 of that, 58 of that, whatever — and at the end you just send that.

**Josh:** Could there be another box just for…

**Jake:** This is the problem.

**Josh:** This is all the plants you have, and there's a button "add plant." To add a plant you need a pot size. Every plant has a pot size and prices. Imagine you're creating a purchase order — "we don't have that plant in our database." You'd need to go to settings → plants → add plant → type in name → it generates an SKU. You'd then add prices — you don't have to, this could be 0, but you'd want some prices.

**Jake:** Do you have anything about plant descriptions on here?

**Josh:** Yes — it's not there because you don't need it for the PO, but if you're adding a plant, the plant has all those fields.

**Jake:** Wouldn't it be easier on the PO side to add a box: if there's no plant in there, type it in, put the unit price in, and the system creates the product itself?

**Josh:** It's a more convoluted workflow, and you wouldn't be able to add category, description, care instructions. It has to be done — when you order the plant in and get it in, it'll need to be added. Imagine you really want that plant and you do three different POs — you create the plant once, then you just add the same plant. Once it's in the system, it's in the system.

**Jake:** It'll be a lot easier to add than it is on GrowMaster — GrowMaster takes ages.

**Josh:** It'll be exactly the same — give the plant a name, category, description, care instructions, prices, save. As soon as you do that, you'll go to purchase orders, and it'll be there.

**Jake:** Okay — and this is good because if you're doing a purchase order, you can see "oh, we've got 18 of that, so I'm assuming you're going to want that as well."

**Josh:** Yes.

**Jake:** I think — and it's going to be really bad because I'm going to get more stuff to do — but a button or a section that shows low stock.

**Josh:** That's a stage two thing.

**Jake:** Sorry — well, you've got to do it. If you've got the live stock levels, you can save the screen.

**Josh:** You'd have to scroll through. There's going to be God knows how many plants in there. Someone needs to know what's in stock. We can have a filter — it's very easy: you've got all the plants and you can filter by ones with very low stock.

**Jake:** Something with the functionality to do a stock level report — run a report of all stock from lowest to highest. That way you can go in, work through the lowest, making a list.

**Josh:** Going to stage five but essentially…

**Jake:** How many stages are there?

**Josh:** I don't know, but in my head this is a stage five. Not even auto-order — you click a button that says "generate POs for any plant we have less than five of." It creates a massive list, you remove ones you don't want, and it creates one big PO to different suppliers. Boom.

**Jake:** But you need to know which suppliers have which plants at which moments.

**Josh:** It doesn't matter, because they come back to us if they don't have it. We don't really care about their availability — you're sending a PO; they'll come back saying "we'll have it next month." The POs aren't based on availability; it's "what we want, can you provide?" They'll say yes or no. Again — that's stage. To do that you need to know which suppliers have which plants. Ideally you don't want to be sending a scattergun approach.

**Jake:** Yes, but we're already labelling plants to a supplier — the system will start to learn.

**Josh:** Yes, so it'll go back to who we've worked with before. Anyway — that's stage. Right now, this is a huge step forward.

### **PO workflow — sending, requesting, marking arrived, reconciling**

**Josh:** For purchase orders — what does it look like next? Save changes, then "send to supplier." It creates an email. You look at it: does this look good? You send it. At that point it's "requested" — it appears in the requested tab. You've sent the email. The supplier emails Jake and says "we've got this," and Jake marks it "supplier confirmed." That's marked as paid — well, marking as paid is a manual process. When it's arrived, you mark it as arrived. You've got your supplier orders, your approved, expected delivery. Some things we can't automate, but it's like — when you come into work in the morning, what do you want to see? What's going to make life easy?

**Jake:** I thought we had "paid" because our biggest auditors are suppliers that don't chase.

**Josh:** Okay — that's true.

**Jake:** Can we edit it once it's been requested? Let's say they come back and say "we don't have this." Would that send out another PO?

**Josh:** Yes. As soon as you mark "arrived," that will change the stock value. So you need to be able to send, because there could be that whole thing of requested, and so on…

**Josh:** Reconcile — this is when a PO arrives. They might have sent 100, they might have sent 99\. You don't know until it arrives. What I imagined is: stock arrives, someone goes out and reconciles "okay, that's 99, that's 89," etc. They need to reconcile the amount and the location. Whoever's reconciling will be in the office, so they say "this plant has arrived with 20 and is now in bed 20." They'll come with a sheet of paper — that's the delivery note — and Jake takes it and reconciles.

**Jake:** It makes sense — like, you can put it on an app, but we don't need an app for absolutely everything. A delivery note is nice — it's physical. You're outside, just writing down quantities. So we start from here, cross out 19 and write 20\. Pretty good.

### **Cost price discussion**

**Jake:** Unit price — would that change on the delivery, from what we requested to what arrives?

**Josh:** No, it wouldn't change.

**Jake:** So why would we have an option here to change the unit price?

**Josh:** Here you're doing location and quantity — pretty straightforward. This is already set in stone.

**Jake:** Surely you're not going to be requesting a price — you'd just request a plant and quantity.

**David:** Companies always ask for a PO with a per-unit value on it, because they need to reconcile.

**Josh:** So you'd want unit cost there. If unit cost does change, you change it here, and that changes it for all POs for that plant. You can edit it on a specific one, but this edits it across the board.

**Jake:** Brilliant.

**Josh:** Pretty straightforward. You can hand out responsibility to someone else — it's not always going to be you. But for me, you are the most important person, because you're the person going to use this. Having your opinion is important.

**Jake:** I think it looks good. It just depends on whether the supplier will like receiving it in this format, because they're used to receiving it in their own format from everyone. But for example — Rhymebeek — I will just email her saying "can I get X, Y" because I don't want to go on the spreadsheet. She does it, but every time she's like "you realise you can use our website to do this?"

**Josh:** What do they have on their website — a spreadsheet?

**Jake:** On Rhymebeek's website you go on and they've got an availability list — spreadsheet ordering process.

**Josh:** It's what we're trying to do here — create that PO spreadsheet for our customers.

**Jake:** Anyway — but it must be done. If we have to duplicate it and do it manually, then it has to be done.

**Josh:** Do you see that being a problem for suppliers? I don't know until I do it. We're getting them to bend to our process — saying "this is what we want, here you go." We could generate a CSV from this if they prefer. But we'll be sending them a PDF anyway.

**Jake:** I'd say that's their problem. You get customers asking for stuff in the body of an email.

**Josh:** Another thing — if a supplier comes back and says "no, you have to use our thing" — in that case, you'd need to use their system but also do this, because this is your way of reconciling. It's a to-do in your daily list. The most important thing is reconciling. When it does come, you have it there, you get your sheet, and at the top of the button, you can add that in.

We don't want people just going into the PWA and manually updating stock. It should be part of a PO. We paid this money, we got this stock — it's an expense for the business. If you just have people manually editing stock, then now you've got 20 plants instead of 10, but you haven't accounted for the £200 you spent. So this will be compulsory whether or not you use their system.

**Jake:** You just have the two things open on two different screens and move as you go. That's easy enough.

### **Pending orders, ready-to-pick, and the PWA**

**Josh:** I'm going to skip Ariane for now. The customer has requested plants to be delivered in two months — yes, an order will be pending when the customer has requested plants in X amount of time, or the plants have gone out of stock since the quote was made. A customer makes an order, plants have gone out of stock between the quote being made, the quote being accepted, and the order being made. Does it happen?

**Jake:** Yep.

**Josh:** If that happens, it'll just be pending. We need custom logic to catch that. You'll have your orders and it'll be pending — that's it being flagged. You'd need to create a supplier order, but it'll be there as a to-do.

Or the delivery date is in two months — that could maybe go into "confirmed," put the delivery date, and it just sits down the list because it's still a confirmed order. So a pending order only has one thing.

Ready to pick — we've discussed this. You'll manually change an order from confirmed to ready to pick, and assign someone. That's the admin job.

**Jake:** Cool.

**Josh:** That's a slight change — we'll need to update that. On the PWA, the staff will mark plants as staged when they're picked. They go on the PWA and mark it as picked, then if you want it staged. On Mondays and Wednesdays, the packing team comes in and they need to mark it from staged to packed. On the PWA, we'd have "pick list" but also "staged." The people in the packing tent don't care about what plants to pick — they care about what plants to pack. Once it's packed they need to mark it as packed. Then you know it's ready to be collected.

**Jake:** Would it be possible to add some functionality? At the moment, say we get a £2,000 order — that's 16 boxes. I need to know how many boxes. Would there be an option for the packers to communicate to me how many boxes, so I know I need to print 16 labels on DPD?

**Josh:** Could you put a note?

**Jake:** Yes — most things, I just know there'll be one box, because most orders are between one and ten plants. So most are one. At the moment I give them the delivery notes — which will be electronic now, so they won't have paper ones. But if it's a big order, it might be two, three, five boxes — you never know.

**Josh:** Okay. So when is it "packed"?

**Jake:** It's in the warehouse — the garage.

**Josh:** So you go and see the boxes, and the current process is you print labels and walk over with them.

**Jake:** Yes. As I'm going through anything that's an obvious one box — 95% — I just print one label. From the order, say they've got five one-litres, I know that's five kilos. One box, five kilos, print the label, fold in the delivery note. 95% of orders are like that. The ones that are multiple boxes I can see — it might be 40, 60 kilos of water — I know that's three boxes. But you can't always tell. If I just print three labels, they might come back saying "I only took two boxes," and I'd have to void it and redo as a two-boxer.

**Josh:** Let's think about how this will work. "Packed" — your orders are all packed and ready to go. You've got a DPD order. You need the customer name and address to click. We want you to be on the computer with this and DPD open in another window. Put in the customer name and postcode and you get everything you need.

**Jake:** Telephone, email address.

**Josh:** Perfect — they should be on the DPD system already. Then you print the label. Should there be another stage — should it be "packed" with another stage after, "labelled"? Would that send an automatic confirmation?

**Jake:** The customer only gets a notification when the order is confirmed and dispatched. That'll be DPD. We're not going to be doing "DPD bone tracking" — it'll just be DPD.

**Josh:** I don't think it needs a separate section. Packed is packed with a DPD label.

**Jake:** Unless you have a note section at the bottom before quick pack, where the packers can message saying "I need X amount" — instead of walking all over and waiting five minutes while you print it.

**Josh:** Just imagine using this — these are your to-dos. Three labels are sitting and packed but haven't been labelled. What would be useful to see?

**Jake:** I'll remember if I've labelled them — every day I need to look at the pack tab. So maybe I'm overthinking it.

**Josh:** Yes — I don't think it's a big enough problem. 95% are one label or obvious two labels. Once it gets above two boxes it gets a bit harder. You can imagine 20-25 kilos per box, that's as much as DPD will let you do. For the multi-box ones, we can do it the way we do now. I just give them the delivery, let them pack it, and print labels after — I can see from these orders what's a big one, what's a one-boxer. I can print all the labels for them.

**Josh:** From a bird's-eye view — "lines" is items. Or that could be value. From a glance, an order that's £50 is one box; an order that's £2,000 is collection anyway.

**Jake:** With "staged" — if I'm working off "staged" for my packing — actually, what I do at the moment is work off the email. Email open on one screen, DPD on the other. I see the order itemised per line — say five one-litres of whatever. I'll be like "five kilos" — six, seven, eight, nine, ten, eleven. Then I'll copy-paste their data from the email onto DPD and print. If I'm using this instead of an email, I'll need pot sizes in here so I can have a guesstimation of weight.

**Josh:** Pot size — yes, you've got it.

**Jake:** Cool — I can do it off that instead of email.

**Josh:** Yes — pot sizes are already there. We'd like to automate that, but having it manual is fine for now.

### **Exceptions, alerts, and low stock**

**Josh:** Right, this is just a general thing — exceptions and alerts. As the manager, what's important for you to know about? Overdue supplier POs, credit limit breaches, low stock alerts — out of all this, what catches you off guard?

**Jake:** Stock is very difficult to control. We've got potentially 5,000 varieties — monitoring 5,000 things is almost impossible. Low stock alerts would be fantastic, the biggest thing.

**David:** But every plant would need its own trigger point, because some plants sell 500 a year, but some only 20 a year. You still want to manually set the trigger point for each.

**Josh:** What about 10%?

**Jake:** 10% of what?

**David:** In EPOS, in every plant you can put a minimum number, and it'll ping up once your stock goes below that.

**Josh:** Something like that we can add — like a most. That could be part of each plant.

**Jake:** Would a low stock alert be per pot size or for total?

**Josh:** Not per pot size — per plant.

**Jake:** Of all the pot sizes added together?

**Josh:** Yes.

**Jake:** Yes. Already with some of the AI stuff I've been trying, the pot sizes confuse things. If it was just one pot size, it'd be way easier. For example, I need to know I've got — let's say "Aubergina Jobel," a particular type of anatomy — I need to order more when we get down to 78\. Whereas something more specialist we don't sell that much of, we could have probably 10 in stock as the trigger point.

**Josh:** That would be a very easy thing to add.

**Jake:** And it would need to be added manually — every plant adjusted manually — but it doesn't all need to be done in one go. As you're adjusting stock levels, what's a good trigger point? Slowly build up your asset, starting with things that move quicker. By and large, a lot of stuff that doesn't move, we've got a lot of, because the longer it sits there the sooner it needs to be split into more, because it's outgrown its pots. So you cut it in half, create two pots — that happens quite a lot, you end up with a big arsenal. Whereas the ones that move quick, they come in, get potted on once, and go out the door.

**Josh:** Cool — those are all my questions.

### **"Looking Good" list**

**Josh:** Friday — you're free?

**Jake:** Yes, of course.

**Josh:** If anything else comes up, I can ping you.

**Jake:** The only other thing — I don't know if you had this on this — which we could do, which GrowMaster does at the moment, is the "looking good" list.

**Josh:** Let's briefly talk about that.

**Jake:** A "looking good" list — basically, I go around the nursery and manually make a paper list. I'll say "Begonia winterglove looks very nice at the moment, we've got quite a lot of that." I go around like that, any ones that are just about to come into flower or looking particularly nice — they're going to be very easy to sell because of the right timing. I make a list, headed "Mac Plants — Looking Good List." How it works on GrowMaster: you type in a code for each plant, or actually it's an auto-generated list of all plants and you click "Y" for yes next to all the ones looking good. Then it auto-generates a list. You can save it and send to multiple people — usually the people who normally purchase that kind of stuff, like the Botanics.

**Josh:** Plant name, pot size, quantity, or just plant name?

**Jake:** Plant name, pot size, price.

**Josh:** That's a pretty simple thing.

**Jake:** It doesn't need to be linked to stock — just a recording function.

### **Coming off GrowMaster — labels**

**Jake:** The biggest drawback I see about coming off GrowMaster in the immediate future is the integration of the labelling system, because we need to print a lot of labels. A lot of our labels are printed manually, but all the orders that go through GrowMaster auto-generate their labels in two styles — retail and trade. Retail are more aesthetically pleasing; trade are more information-heavy.

If all that goes manual — we get quite a lot of trade orders, anywhere between £500 and £5,000. We'll have to use HLS's software. I spoke to Jura ID — they can guess that software, they can rip all the stuff off GrowMaster and put it on that software for us. JuraID said they'll do that.

**Josh:** Provided the price isn't too steep.

**Jake:** We could maybe do that in advance and run trials to see the difference in time. If manual is going to be the way forward, then we need to know.

At the moment — say an order comes through for a lot of plants — I've already created a sales order. It's "convert to picking list," "auto-pick all." GrowMaster auto-picks everything except anything in two locations, where you manually allocate which location — or if it's allocated to someone else and unavailable, it'll say you can't, so you have to add more into stock or substitute.

Once that's all done, you click "print labels" and it just spits out all the labels.

**Josh:** Really. Wow.

**Jake:** When I'm manually making labels for the shop — for trade and retail we only make one label per plant variety. Even if they have 50 of one or 40 of another, I'm only printing one label. It makes no difference from a manual input point — it just takes longer to print, but you only enter it once. But if they had 500-700 varieties of plant, that's a lot of input.

What I do is type the code — say I want Azalea Japonica, I put A-Z-E-J-A-P. Number of labels, one. The price — for the shop, £15.50. Type the next code, the next one, etc. That all fits within the database. It would be the same with HLS because it's the same company.

So once you've done all 350 varieties manually, you press print, choose format — shop, barcode, retail, trade with plant passport — and print. That's my concern: if we have a huge order.

**Josh:** Probably it's rare enough that it's not — yeah, it's still going to be marginal. It's one area where we're losing time, but we're saving loads in other places.

**Jake:** Maybe down the line — stage three — but it's up to you.

**Josh:** What's priority number one to add after order lifecycle? If you want to go over and show me how that system works…

**Jake:** Do we have a plant passport number on the plant?

**Josh:** Yes.

**Jake:** Our plant passport number is 00344\. That pertains to any plant we sell — it's our code. So it's not item-sensitive for Mac Plants — it's just Mac Plants' code for a class of problem.

What I'm doing now: because we're invoicing out from Xero, I'm still attaching the GrowMaster itemised invoice, marrying the numbers, and sending it. But the actual Xero — we need to clear that out.

*\[transition\]*

**Jake:** I'll show you how we do label generation.

**Josh:** Let's go to General → Label Job Listing. These are all my previous label jobs, which I need to delete. This will have a record of all the ones done out of GrowMaster, plus ones you can do manually.

If I type, say, "Rebecca Goldstrum" — RUD GOL — one label, price £5.50. Then type the next one. There are various here — barcode for the shop, plant passport info. Effectively, if I have to do it all manually with 50 different varieties, I have to do it 50 times, then print. It'll spit out two labels of each, or however many.

But because it's connected to GrowMaster, it's connected to the pick list. From GrowMaster: Sales → Picking List Listing → pick one. Picking list line items would all be there — click "auto-pick all," they all come down, press save. It says "do you want to print these 12 labels now?" If you click no, it'll automatically want one label per plant. Go to General → Label Job Listing → edit the label job. It says 12, 6, 8, 9 — for each variety we only want one of each label. That one's already done.

**Josh:** But for retail you want a label for each plant?

**Jake:** Yes — but for retail we just do it manually anyway because it's not pertaining to an order.

**Josh:** What about mail order?

**Jake:** Mail order, we still do one per variety. It can be confusing in winter — if you had two ascers going out and 24 of each, you might have to make that call. The packers will pack all the same one in one box with one label.

For the shop, I ran a load this morning. They'll end up with a big stream of labels. They send me a list — "Cersei and Ruvaria atropurpurea, one litre × 15." I'll type CIR ATR, select one litre — important to select the right pot size because of barcodes (97 vs 1 litre vs 2 litre, all different barcodes) — × 15\. Then "ACH SMU" 15, £15.10. Work down the list, press print, select format with barcode, and they all come out.

For shows these lists can be quite big — probably as big as any trade order. We'll save that time even without integration, given what we're saving from all the other things. Through a show, you'd have to do it manually anyway.

**Josh:** Yes — the thinking behind keeping labels with them for now: even when we do integrate, we're not going to write our own label-writing software. We'll just integrate into their system and have a button on the ERP saying "print labels."

What I mean is: each plant pot needs a unique identifier, an SKU. Right now in GrowMaster, that's the plant ID — that's the unique identifier, and that's what's used for label printing. If we're going to integrate with their label printing software, how do we identify a specific plant? We'd have to use the plant ID. Not ideal, but…

**Jake:** I'm trying to work out — if we can get the label printer running off the HLS software for our shows, we'll still use GrowMaster for the orders until we're fully switched over. We'll get an idea of the interface — I imagine it'll be the same. I'm trying to work out if not being integrated is an option long-term. The benefit of manual is: it doesn't need to be on our computer. Your thing will be cloud-based, so you can have multiple users. Effectively, if you've got a computer there with the software, shop staff can come in without the app and just print from the HLS software what they need.

**Josh:** Yes — anyone can use that software. It's not like one computer does all your label printing, which is what you do right now.

**Jake:** Long term I guess we want to integrate. The big question is: will it be very painful?

**Josh:** I don't think it'll be that bad. The picking is what's killing us now — the time it takes to pick is way higher than it'll be once we've got the stock control system, which looks really good on your thing.

### **Digital map and bed sections**

**Josh:** Did you add a few more sections to the digital map?

**Jake:** No, we haven't. We could go and have a quick look at a couple of areas — I need a map split into 8 or 10 sections. It's actually only two more sections; one falls just outside the current map, so I might draw a bigger map. The other is within the map, between the twin-span tunnels and shade tunnel — that area, known as Glenkint. We could just call it GK.

**Josh:** Like when she split it into four. If you're splitting beds into 10 or 8 sections — right now you're doing North/South/East/West — if it's going to be 10, that no longer works. So you'd have to do bed 1.1, 1.2, 1.3 — your beds numbered 1 to 20, each bed numbered 1 to 10\.

**Jake:** A quarter of one of those beds is quite a lot of area in winter. If you're going off labels, you have to look down all the way along the bed. Whereas if you split the bed into 20, you cut down the search time. If they say "move it from bed 1.1 to 1.20," they can quickly do it, so next time someone goes to look it's instant. Multiple people being able to move things — that'll make the process way better.

**Josh:** Cool — yes, for that I just need a map.

**Jake:** Shall I show you what a "looking good" list looks like?

**Josh:** Sure.

**Jake:** That looking good list — I think that's something I can do. Once we get the big blocks in place — the order flow and things like that — those are so important. The edge cases like adding this — there's no logic attached, just a list at a date. It's pretty basic.

You edit this — "Looking Good List for 23 April 2026" — there's a comment header where you can write "all plants on this are looking good, have nice values and/or flower." Then "looking good with details" — go through, click on it, make little comments. Adjust pot sizes etc. "Other remove items" is what you go into — you type in your code. Type "Aster" — it comes up. Say you want Grindalflora — click on it, automatically puts a yes. Click yes on all of them. Save and print.

**Josh:** I was thinking it'd be similar to quotes — line items, where you type on a line item instead of having a long list. Save and print. It can be a PDF download — so you press "download PDF," and you can always print the PDF from your computer.

**Jake:** The actual printed copy — it's from our perspective; we're sending it electronically. That's basically what it looks like. Multiple pages. It's basic — it's got the header and everything.

**Josh:** Cool. I'll send you the live ERP link by WhatsApp — have a play around. Imagine you're using it, imagine coming to work on Monday morning. Is there something you see that's not ideal? You can voice-note me — totally cool. We're at the stage of building, so it's the perfect time for feedback.

---

## **Part 2 — Quote/Order Flow Continued, Roles, Reporting, Data, EPOS**

**Josh:** Within their credit limit.

**Jake:** Say somebody with a 30-day credit account has £10,000 limit, requests a quote and it's for £10,000 worth of plants — they want to go ahead, but they've got 30 days…

**Josh:** We're going to invoice that at the same time, aren't we?

**Jake:** If they've got a £10,000 credit and a £10,000 order, they can put that through — they don't pay. It goes: customer responds to quote → customer makes order → within credit limit → pending order → plants in stock.

**Josh:** This has changed a little. Customer responds to quote. That's just if that cycle happens. We need another arrow to go here. Let me move it into dark mode.

— *\[diagram editing\]* —

**Josh:** The customer could respond to the quote, and then — quote sent to customer, that's not right. The customer responds to quote → quote awaiting response → we reply → quote sent to customer → they accept or reject. If accepted, order confirmed. Then awaiting payment. They pay straight away — that's the pay-now flow. This is the credit limit flow: they make order within credit limit. Are they in stock? If not, it sits in pending. If the customer has reached the credit limit, they pay on Stripe. Are the plants in stock? Has the customer requested a late delivery date? If yes, confirmed. Then live → ready to pick.

There's quite a lot of different things that can happen. So at the very end — order completed → 24 hours later, send final invoice to Xero → mark stated. An order can be marked paid or unpaid.

**Jake:** When it's completed, does it go back?

**Josh:** Dispatched. This is why I'm thinking dispatched / collected.

**Jake:** What did Ariane say from the day? Do we not want to stop people from ordering well in advance?

**Josh:** It's an interesting question. If someone orders six months in advance and they've got a credit limit of £10k — that's an unusual use case. At that point I'd say it should be a manual intervention. The rules of the game in this system are: if you have credit, you can make an order, we'll invoice you at the end. If you go over your credit limit, you pay 100% now.

**Jake:** Can I just read this?

**Josh:** Yes. This is a really important point. Orders should be in the order of delivery date because you want Jake to come to work and think "okay, what am I doing today?" Ready to pick — things will go automatically, but maybe they need to go automatically if their delivery day is in two days.

So a super important point: for retail, when a customer pays — do retail customers get the same level of treatment, or do they just get 48 hours of waiting?

**Jake:** We go on an e-order on the web shop and we just get a quick stream of the next one.

**Josh:** So 48 hours, or collection?

**Jake:** Collection we say 48 hours — I don't want to change that. If you order online for shipping via DPD, what should happen: order comes in on Monday, packing girls in on Wednesday, packed on Wednesday. If you order on Tuesday, Wednesday — yes, packed. If on Wednesday, packed Monday next week. For us it really starts Sunday, on here. So we'll just say delivery time "two to seven days." Eventually, when I had it, I was chipping up plants and using "Woodave," but that's where we are now.

With commercial trade clients, we'll pick a delivery date, but they'll keep changing that delivery date because their project might be behind schedule. Nobody wants the plants if they're not ready for them. But once it's ordered out, we won't keep coming back to maintain them.

**Josh:** Right. We don't really know what that problem looks like just yet, so it's hard to say. Maybe something in the system like a storage fee.

**Jake:** That's a stage two thing. But you need to be aware of it now.

**Josh:** Right now what we want is — for trade customers, they need to specify a delivery date, an exact date.

**Jake:** When do you want them?

**Josh:** Yes — when do you want them. For trade customers, they're not using DPD. Jake will organise the delivery.

**Jake:** Yes, we'll ask for a delivery date — actual delivery date — and we can work backwards from that.

**Josh:** Cool. Trade customers will be able to specify a date on the trade portal.

**Jake:** Yes — there'd need to be a proper warning saying "please note we cannot guarantee your order will be delivered on this date." Treat it as a preferred delivery date.

**Josh:** Right. Noted, perfect.

### **Admin/staff assignment, completion, invoice posting**

**Josh:** Admin staff manually assign staff to pick certain orders. Each staff member has their PWA pick list. In the morning, Jake says "okay, we've got all these orders ready to pick" and assigns them.

This needs to be easy. We could automate it, but it's nice for Jake as a manager — maybe someone's good at picking some plants, someone's good at picking others. I think being a manual job is advantageous; anything can be automated, but Jake making those decisions is good. We can confirm with him — as long as he's happy.

On the PWA, what would be the stage when they're picked? "Picked" — that's fine. Then "completed" — 24 hours after collected/dispatched, order marked complete. At that point the invoice will be posted to Xero.

**Jake:** Cool.

**Josh:** Trade clients on credit — invoice sent among the jobs being dispatched. As much as I hate it…

**Jake:** Once we've all just penned it.

**Josh:** Embossed order — that's in the right place. If the order changes, what happens on Xero? How do we do fixes? Because the big advantage was, the order's not — wait. The invoices are going to get sent to Xero, marked, and once it's complete it's the invoice on the ERP.

**Jake:** Then that invoice will be editable.

**Josh:** But if you want people — "order is live, the invoice is sent to whoever to pay" — when you do that, I thought you sent it on Xero with a payment link.

**Jake:** Yes — but if we keep it that way, we're not going to pay. If we want it reconciled with Xero…

**Josh:** What we have is: a fair idea to pay and a fair idea to come and collect. That means we can send an updated invoice within that time if there are any mistakes or changes.

When an order is made on the ERP, the invoice will be made on the ERP, not on Xero. We could send them that invoice and say "you've been invoiced," but it's not created on Xero — we're just not sending them the payment. It's a Stripe integration for that payment link.

**Jake:** Yes — if you'd be happy with that, then we could. It'd be an email with a Stripe link, and they could pay. Then the finance team would manually reconcile the payment and link it up.

**Josh:** I imagine when you pay using the Xero payment link, it marks as paid automatically. So this creates a manual process — but it's compatible. Okay — that's important.

### **Cancelling/archiving orders**

**Josh:** Orders can be cancelled. Reserved stock goes back into stock. It needs to be a to-do task. Do we need cancels, or can we just delete orders? I know you said you want a 20% fee.

**Jake:** Can we store them?

**Josh:** Yes — it would be preferable to just delete an order. I'm not sure if you can do that on Jorber — I'm not sure if there's an archive.

**Jake:** Okay — so we could have a status "archived" instead of "cancelled," and you can see the audit trail. The deleting function is annoying — you can always think it deletes, then something comes back up. So I just think archiving will help.

**Josh:** I'll make that a status. Up here too — a quote could be archived as well. It is wickedly complicated. Well, not complicated — there's just so much logic. This happens, this happens, you put two things together and it's archived. Each one we're drawing a short bill of history.

**Jake:** Cool, cool, cool.

**Josh:** So either a quote or an order can be archived. Perfect. We'll discuss the Xero posting flow when those guys come back.

### **Email and resend**

**Josh:** For emails, we're going to have to use an email service — Resend. The ERP needs to send emails. Does it pass through firewalls? This outsources that — we want to know emails are actually sent and delivered. Pricing is not that expensive. That'd be the idea.

Delivery methods — these are all your delivery methods. Maybe this is new. There's also the shop stuff. When Jake comes, what I was looking for was just to show him the prototype and go over use cases. This is what I have from Ru/Konday.

If trade customers couldn't, it'd be the default. Actually — that's not the same. I don't know.

### **Customer balances and tasks**

**Josh:** Customers will have a balance. Money has returned to the bank account — okay. Tasks can have different types: finance, admin, staff, other (catch-all). We can attach a task to an order.

**Jake:** Is that a connection that we spoke about?

**Josh:** Yes. There'll be super admin, admin, and staff. We're like — I'm not sure if we need super admin. The only difference between admin and super admin is: super admin (you) will be able to see what everyone has done on the ERP. So if you have the unusual situation of someone putting wrong info in, you can audit. I'm not sure how useful that would be — to have super admin on Jake's office computer, just open for everyone to see.

**Jake:** I don't know — is that really okay? You don't want that kind of control? Well, it's not control — it's just a lock. Maybe if people know it's there, that's a deterrent.

**Josh:** Yes — it's literally just a log. You'll also have the ability to add and delete staff members. So that's also important — managing access. There's a reporting screen too — that's the dashboard. The dashboard is lower priority.

**Jake:** Yes, we don't need that.

**Josh:** We do need it eventually, but it's not "have to have." The data review and the quote builder — yes, the quote builder and the order lifecycle for me are absolute priorities.

So — do we need admin and super admin?

**David:** Just so they can come and delete the record — but we're going to get into the input and delete button. Maybe if we're not with tendency, we just having to go out to Jorber — only one person can delete jorber and change the button. Is that me?

**Josh:** It's the super admin.

**David:** "Can I come home and say I want to delete jorber." Yes, okay.

**Josh:** Cool — so we'll keep that just so there's an account control. That makes sense.

### **Dashboard exceptions and alerts**

**Josh:** I've got a thing on the dashboard for exceptions and alerts. What I'd like to ask Jake is when he comes in in the morning, how does he structure his to-do list? What are the first things he looks at — orders, quotes, supplier orders? What's the first thing he wants to see?

DPD — in terms of the labels, I need words on that. She said it was going to work — she was going to email me. I'll check.

**Josh:** When Jake comes, I'll get more off talk and check what she said.

— *\[Josh thanks David\]* —

**Josh:** Right — Jake to write down unusual use cases. Team Tigrine might sort of stop hold period.

In terms of pending — I've just said two months but I've kind of picked something out of the sky for that. An order will say pending if it's requested for one month — it'll still be pending, then manually converted to confirmed. To convert to confirmed, you can have a lot more — okay, I'll have a look if anyone's confirmed, just to add manually.

Ready to pick — if you have a delivery date on Friday, you just want ready to pick to be the day before, or 48 hours before. Maybe two days before, in case there's an issue. Giving you a chance to affect it.

I think all this stuff to look at is for Jake. What we could do in the meantime is look at the data. That's what I was going to talk to Ariane about — there are questions about the data too.

### **The data**

**Josh:** This is real data. We can't see all the plants here, but we can see them here. Oh no, we can't see trade price, can't see retail price, and we don't have cost price. So there's a load of these — this is one big thing to talk about. There are 4,000 items here where there's some kind of issue.

**David:** Open governance.

**Josh:** Yes — with data. We want to get this data as good as possible, and we have time to do this now because it can work independently of the development. The first stage is looking at this, looking at the figures and the analytics.

Order, historical orders, analytics. Obviously we want to exclude mail order and retail. Once we do that, I'd like to know how accurate you think it is — do you have a source of truth?

**Jake:** They must account for the last week. They must account for half a million a year — about 2.5 over five years. We did 2.9 — take away £40k or so of cash and retail. So 2.1?

**Josh:** April to April. Is that about right?

**Jake:** I'm trying to cast my mind back to what they said as part of the sale. Everything is a bit — you know, it's just not 100%. But we're looking at the back of the park. Yes — that's right.

**Josh:** Good — this is what we want to know. The next stage — settings, this — right now we don't have this, but we want to give you an interface where you can see a plant name and the trade and retail prices. I'm still thinking about the cash and retail side. It's not a massive amount.

We want — like, not everything has a price right now. Right? We need this data. The state of it: we've done the first import. I can send you these observations made of what worked well based on this — the amount of parts, the amount of skates, missing GM keys. There were loads of things where the data was good or not good. So there are these questions potentially. I'm going to read through them and try, instead of barding you with 20-30 questions, because basically we know exactly what we want — we want this.

**David:** Where do you get the text from?

**Josh:** From GrowMaster. Unfortunately GrowMaster is kind of "make up prices." Up till now there were no kind of set prices — they could put a price in, and it could vary by 50p. We have a Google Drive — everything's here. This is all the stuff Josh sent me. "GrowMaster plant export full" — it has the prices. We've got the plant name, quantity, and somewhere around here you've got price.

**David:** Yes — "order value." So you've got price one, price two. We need to know what data you want from your perspective. I don't even know if this is trade or retail price.

**Jake:** No — we use this to create our new pricing spreadsheet for the EPOS system. Joy had his laptop open this morning, I was showing you a spreadsheet of taps for different suppliers. We use that to uplift our pricing. I can pull all the data out of EPOS with all the pricing.

**David:** It won't marry the pot sizes, though. There are different product names for every plant with different pot sizes. So like "what kind of mollus" 7cm, "what kind of mollus" one litre — completely separate lines. So it's going to be an absolute nightmare to marry that up.

**Josh:** A lot of this — AI can understand that this is a plant and it's got different pot sizes. If you have a plant with a name that includes pot size, it can understand that.

**Jake:** Let me pull that out — it's quite easy. That's our Bible now in terms of pricing.

**David:** It should really be the same as what's on the website.

**Josh:** How many products?

**David:** 6,000.

**Jake:** 2,300 with stock. We import 6,000 because I import all the historical data too.

**Josh:** I don't put the volumes in because we don't track volumes in detail. When we transfer over from GrowMaster, we're going to take quantities from GrowMaster for plant stock?

**Jake:** No.

**Josh:** Surely your stock is fairly accurate — GrowMaster?

**Jake:** No — plus or minus maybe 5%.

**Josh:** Okay — that's pretty good.

**Jake:** Not bad. But I mean, the system on GrowMaster says we've got 170,000-160,000 plants in stock. We don't. I think it's less than that. Full honesty — they bought the company and Gavin said there were 200,000 plants. The first day we walked in, it was 130,000. From that moment on, I don't trust the data on GrowMaster. There are probably 34 plants in negative volumes. There was never a stock-take system. It wasn't done.

**Josh:** Okay — you'd use that, and then it'd be a whole job for the staff to do a massive stock take.

**Jake:** I think — in stage one, how are we going to manage nursery stock?

**Josh:** Yes — you see what the ERP is going to be like. The data in it is massively important. We've got the data from GrowMaster, from Mac Plants. But in terms of stock level, that's very much — I was thinking we'd take that from GrowMaster, but the best thing is to do a stock take. Right now we need to work because we've done this big import. We've got the data for the first time. It's possible we can refine this data for the next month or two, getting you guys the prices. Then just before we hit the red button, we do a stock take and update inventory numbers — but not prices. The prices stay.

If you'd be up for the task of going through this and adding prices to your most important thousand plants, you'd have your prices: retail, cost, and trade. Hopefully if I give you this it'll be easier.

**Jake:** This is a lift from EPOS. Don't worry about that. There are 2,900 products — but there are some duplicates. There's a whole category of "shop" (retail) and "nursery" (trade), so you've got duplicates.

**Josh:** Wait — did you take the entire GrowMaster and put it in here?

**Jake:** Yes — but not stock. I tried to. There are stock volumes there, lifted up from GrowMaster, but I don't use it. I can't track it. I don't use it because — this was done two-three weeks ago. So what I'm going to go after is live. If you put up stock right now, it won't be tracked on this. How I've done it: categorised as "nursery" (the nursery, your website, your shop). Mainly categorised by herbaceous, shrubs, etc. Essentially, the shop is retail pricing and the nursery is trade pricing. So you have duplicate products in different categories — the same plant in two-three categories with different pricing.

**Josh:** Okay — okay. So this is not very good data.

**Jake:** Yes — but it's essentially what you need. If you rip that out, you find a trade price.

**Josh:** Did you do all the pricing?

**Jake:** Yes — all the pricing is here.

**Josh:** Can you show me an example? For example, if this was a plant — it's nursery. How long did this take you?

**Jake:** About two weeks.

**Josh:** Right. Okay — so this work has been done.

**Jake:** This was the whole thing. We initially wanted to use EPOS for stock management, because it has its own. If I go: products → stock management → stock movements, stock take, suppliers… It does everything we were talking about, really. It'll create its own PO and send it out. Stock take, stock controls, POs raised by suppliers. I tried to get this set up, but then Josh has stock for the nursery side. This is only essentially the shop side I want to do because it's linked to retail.

We're going to get a sticker to build something for the nursery, and we'll incorporate the shop into it. That's why I've got all the barcodes and pricing right.

**Josh:** That's amazing — I'll show you something that's going to make you laugh. "Action required: missing trade price and retail price." There are 4,000 items in this list.

**Jake:** Send me that and we'll try and run this. It'll be very interesting to see how many. Could we take Actia?

**Josh:** Yes.

**Jake:** Let's go to the product list. "Acktea" — A-T-E-A-B-A-I-A. Okay — there you go. So you have two litres — see there, different categories. "Website trade" — that's the price there. "Nursery" — that's a different price. Same product capitalised, but different categories. Website trade price — that's the retail price; the cost price is in the back office. You select a barcode, put it all in, and in pricing here, the cost price obviously hasn't been done, but you can put in cost price and sale price — it gives you the margin too. You add in your supplier — create a supplier — and that's when it goes into your pop-up alerts.

**Josh:** What I'm saying — can we get an alert if any product is less than whatever?

**Jake:** Essentially it does it all. But software is only as good as the data you put in.

**Josh:** Exactly — that's what I was trying to say.

**Jake:** This is shit because I've stopped working on it. But it has everything you need.

**Josh:** What I'm asking for is cost, retail, and trade for every plant.

**Jake:** Yes — I've got it all here. I can rip it all out.

**Josh:** Yes please — it just needs to be categorised.

**Jake:** This was done from the spreadsheet Josh and I did — the one I showed you this morning of all the tabs. That was done based on an uplift, based on the plants we buy in. The nursery stock — we lifted the GrowMaster data out, got the price, uplifted everything by X amount in the system. Let me print this out — well, I'm not printing it; it sends it to me as a CSV.

**Josh:** CSV — just like management. Gosh. That is so cool. I will send you — we'll send me that, and I'll get it put in here. Then I'll send you this again, and I'll ask you to look over the questions. I'm going to ask you to answer the questions, because I don't know this data — you know the numbers of the business. I look at it and I'm like "is that right? I don't know." Let me double check what's putting me off — the cash retail. This can help with your best customers — Josh said "these are the people I need to call." Even now this could be useful.

**Jake:** Brilliant. Yes, I sent you a spreadsheet of all the historical data a few weeks ago. There've been loads.

### **Sampling orders to verify data quality**

**Josh:** Cool stuff. Let me print this out. I'm trying to find — how the hell did I do a big product? Manager → products. If you want to see CSV…

One thing I'll ask you to do — even today — go to orders → historical orders → and let's say go on to this one. Find this order in GrowMaster and see if these plants are correctly matched. Just sample a few.

**Jake:** Yes — I'll sample a few.

**Josh:** Sample a few from both GrowMaster and from MacPlants.co.uk — so retail orders and trade orders.

**Jake:** Is there a separate login?

**Josh:** Basically we've got all historical orders here, but if you look — that's a shop order. This is a retail order, ordered on the website. You can tell because of the name. Go to this order — did she order these plants in these sizes? You'll be able to see that. You won't be able to check on GrowMaster — you'll need to check on emails. You'll have to search for "Lucy Saxon" — did the email come through?

**Jake:** No, no — it's fine. It's a sample. I've got two hours on a computer there while Jake's away. So if you could do that, that's exactly what we want.

---

## **Part 3 — Internet, Stock Management, EPOS Integration, Identifiers**

**Josh:** Hopefully we'll get internet sorted today or tomorrow.

**Jake:** Really? That'd be great.

**Josh:** Starlink's ready to go.

**Jake:** Starlink — is that the Elon one?

**Josh:** Yes.

**Jake:** Is it really?

**Josh:** Josh loves Starlink. It's expensive, and I'm like "can we go cheaper?" I love Starlink and I'm like "okay fine, if you like it, then…"

**Jake:** What's the difference?

**Josh:** It's just satellite-based. It's quite expensive.

**Jake:** Okay, well that's cool.

### **Real order data and revenue**

**Josh:** What we've got is real. These are our orders.

**Jake:** Okay — so the things inside it.

**Josh:** Yes — this is all imported from Google Analytics.

**Jake:** I think you've shown this before.

**Josh:** Yes — but we've got duplicate data. We've got "mail order" — that was everything ordered from the website, correct? And "retail" from the shop?

**Jake:** Retail — no, it's a retail customer.

**Josh:** A retail customer — can you tell me?

**Jake:** Mail orders are everything that's gone through the website. "Cash" is essentially what's been picked up — orders for collection or with a trade customer. Gavin did it in a really weird way. Mail orders were very easy to distinguish. The cash and retail side — it's what needed invoicing. And more trade customers.

**Josh:** Okay — essentially you can rip those two out?

**Jake:** Yes — rip them three out, because they should already be in those numbers.

**Josh:** Already? Because I thought "mail order" would be duplicates because it's literally already there — we've taken data from the Mac Plants website.

**Jake:** Yes — mail order is cash. Yes — that is a duplicate. Cash, if that's trade, then surely it should have been between one of those traders.

**Josh:** Okay. If you rip them out — what total value do we have?

**Jake:** This is the last five years. There'll be a — you can do the last one year. Like…

**Josh:** Sorry — can you do one year?

**Jake:** Yes — let's see what they generated. Scroll down and see what the value for cash was. If you rip out £32k — because I know what they did last year in revenue. I'm not sure if this is calendar year. This is April to April.

**Josh:** April to April — yes.

**Jake:** Regardless — I think that's roughly what they did anyway. They've run a £500 number. That's what they did. So you have to take out — is there retail? You'd have to rip out — yes, £3,600. So that'd be £4,000.

**Josh:** £4,000 — but you're ripping out £40k of revenue. Wait, sorry — yes, £40k. So that would be… £413k. April to April. Is that about right?

**Jake:** I'm trying to cast my mind back — what they said as part of the sale. Everything is a bit — it's just not 100%. But we're looking at the back of the park. Yes — that's right. That's good.

### **Pricing settings — building the master price list**

**Josh:** This is what we want to know. Yes — so the next stage: we want to have settings. Right now we don't have this, but we want to give you an interface where you can see plant name and your trade price. I'm still thinking about the cash and retail side. It's not a massive amount.

We just want — like, not everything has a price right now. We'll get this data. The goal: we open this and we have all that. What we have right now is just text input.

The state: we've done the first import. I can send you observations made of what worked well. Number of pots, number of SKUs, missing GM keys — things where data was good or not. There are these questions; I'm going to read through them and try to — instead of barding you with 20-30 questions — basically we know exactly what we want.

**David:** Where did you get that text from on the last page?

**Josh:** From GrowMaster. Unfortunately, GrowMaster is kind of "make up prices" — up till now there were no set prices. They could put a price in whenever they wanted, and it could vary by 50p.

We have a Google Drive. Everything's here. "GrowMaster plant export full" — this has the prices. We've got plant name, quantity, and somewhere around here, price.

**David:** It's like — order value, yes. So you've got price one, price two. We need to know what data you want. I don't even know if this is trade or retail price.

**Jake:** No — we use this to create our new pricing spreadsheet model for the EPOS system. Joy had his laptop open this morning — I was showing you a spreadsheet of taps for different suppliers. We use that to uplift our pricing. I can pull all the data out of EPOS with all the pricing.

**David:** It won't marry the pot sizes, though. That is for pot sizes — there are different product names for every plant with different pot sizes. So like "what kind of mollus" 7cm vs "what kind of mollus" one litre — completely separate lines. It's going to be an absolute nightmare to marry up.

**Josh:** A lot of this — AI can understand that this is a plant and it's got different pot sizes. If you have a plant with a name that includes pot size, AI can understand.

**Jake:** Let me pull that out for now — it's quite easy. It's essentially our Bible now in terms of pricing.

**David:** It should really be the same as what's on the website.

**Josh:** How many products?

**David:** 6,000.

**Jake:** 2,300 with stock. We import 6,000 because I import all historical data too. I don't put volumes in because we don't track volumes in detail.

**Josh:** When we transfer from GrowMaster, we're going to take quantities for plant stock?

**Jake:** No. Plus or minus maybe 5%.

**Josh:** Okay — that's pretty good.

**Jake:** Not bad. The system in GrowMaster says we've got 170,000-160,000 plants in stock — we don't. Probably less. Full honesty: they bought the company, Gavin said 200,000 plants. First day we walked in: 130,000. From that moment on, I don't trust the data on GrowMaster. There are probably 34 plants in negative volumes. There was never a stock-take system. It wasn't done. Anyway.

**Josh:** Okay — but then it's a whole job for staff to do a massive stock take. They've been told about it.

**Jake:** Yes.

**Josh:** Yes — basically the ERP, you see what it's going to be like, but the data in it is massively important. We've got data from GrowMaster, from Mac Plants. In terms of stock level, that's very much — I was thinking we'd take that from GrowMaster, but the best thing is a stock take.

Right now we need to work — we've done this big import, got the data for the first time. It's possible we can refine this data for the next month or two, getting you guys the prices. Then just before we hit the red button, we do a stock take and update inventory — but not prices. Prices stay.

If you'd be up for going through this and adding prices to your most important 1,000 plants, you'd have your prices: retail, cost, and trade. Hopefully if I give you this, it'll be easier.

**Jake:** This is a lift from EPOS. Don't worry about that. There are 2,900 products — but some duplicates. There's a whole category of "shop" (retail) and "nursery" (trade), so duplicates.

**Josh:** Wait — did you take the entire GrowMaster and put it in here?

**Jake:** Yes — but not stock. I tried — there are stock volumes lifted from GrowMaster, but I don't use it. I can't track it. This was done two-three weeks ago. What I'm going after is live. If you put stock up right now, it won't be tracked on this. How I've done it: categorised as "nursery" (the nursery, your website, your shop). Mainly categorised by herbaceous, shrubs, etc. Essentially, shop is retail pricing, nursery is trade pricing. So you have duplicate products in different categories.

**Josh:** So this is not very good data.

**Jake:** Yes — but it's essentially what you need. If you rip that out, you find a trade price.

**Josh:** Did you do all the pricing?

**Jake:** Yes — all the pricing is here.

**Josh:** Can you show me an example?

**Jake:** Yes — for example, if this was a plant, it's nursery.

**Josh:** How long did this take you?

**Jake:** About two weeks.

**Josh:** Right.

**Jake:** This was the whole thing — we initially wanted to use EPOS for stock management because it has its own. Products → stock management → stock movements, stock take, suppliers… It does everything we were talking about. It'll create its own PO and send it out. Stock take, stock controls, POs raised by suppliers. I tried to get this set up, but then Josh has stock for the nursery side. This was only essentially for the shop side, because it's linked to retail.

We're going to get a sticker to build something for the nursery and incorporate the shop into it. That's why I've got all the barcodes and pricing right.

**Josh:** That's amazing — I'll show you something that'll make you laugh: "Action required: missing trade price and retail price." There are 4,000 items.

**Jake:** Send me that — we'll try and run this. It'll be interesting. Could we take Actia?

**Josh:** Yes.

**Jake:** Let's go to the product list. "Acktea" — A-T-E-A-B-A-I-A. There you go — so it's a different kind. You have two litres — different categories. "Website trade" — that's the price. "Nursery" — different price. Same product capitalised, different categories. Website trade price — that's the retail price; the cost price is in the back office. You select a barcode, put it all in, and in pricing — the cost price right now hasn't been done, but you can put in cost price and sale price; it gives you the margin. Add in your supplier — create a supplier — and that goes into your pop-up alerts.

**Josh:** Can we get an alert if any product is less than whatever?

**Jake:** Essentially it does it all. But software is only as good as the data you put in.

**Josh:** Exactly.

**Jake:** This is shit because I've stopped working on it. But it has everything you need.

**Josh:** What I'm asking for is cost, retail, and trade for every plant.

**Jake:** Yes — I've got it all here.

**Josh:** Just needs to be categorised.

**Jake:** Yes. From the spreadsheet Josh and I did — all the tabs. Done based on an uplift, based on plants we buy in. The nursery stock — we lifted GrowMaster data, got the price, uplifted X amount.

**Josh:** Let me print this out — well, no, it sends as a CSV.

**Jake:** CSV — just like management.

**Josh:** That's so cool. I'll send you — we'll send me that, and I'll get it put in here. Then I'll send you this again, and I'll ask you to answer the questions. Because I don't know this data — you know the business numbers. Like, "is that right? I don't know." Let me double check what's putting me off — the cash retail. This can help with your best customers. Josh said "these are the people I need to call." Even now this could be useful.

**Jake:** Brilliant. I sent you a spreadsheet of all historical data a few weeks ago.

### **EPOS — keeping it for stage one, plus shop integration**

**Josh:** Trying to find — manager, products, CSV. One thing I'll ask you to do, even today: go to orders → historical orders → this one. Find this order in GrowMaster, see if these plants are correctly matched. Just sample a few.

**Jake:** Sample a few from GrowMaster and MacPlants.co.uk — retail and trade orders.

**Josh:** Right. Are they separate logins?

**Jake:** Basically we've got all historical orders here. If you look — that's a shop order. This is a retail order, ordered on the website. You can tell from the name. Go to this order — did she order these plants in these sizes? You won't check on GrowMaster — you'll check on emails. Search for "Lucy Saxon."

**Josh:** No, it's fine — it's a sample. I've got two hours while Jake's away.

### **EPOS for shop, plus barcoding**

**Jake:** I think we just stick with EPOS now and probably for stage one, any plants moving from nursery to shop go when there's an order.

**Josh:** So we sell the plants to the shop?

**Jake:** Yes — well, I don't know how else we do.

**Josh:** Every plant has a location and a status — the location could be "shop," the status could be "retail ready." But when we sell it…

**Jake:** Would it be possible for someone to use the ERP in the shop and just remove from there?

**Josh:** Yes — they could have a "shop" tab. In terms of keeping the stock, that could be your — I'm trying to think — I drew a diagram with this the other day, I've forgotten. We're going to talk about this. The buy-in stops, but you're almost going to shop, but I didn't start to go on the website. So that's going to be on the website — things are going to need that on the database to deal with the website.

**Jake:** Do you want to sell non-plants on the trolley?

**David:** Yes — all the shops we sell are in our shop, the seasonal in clearance — we know the customer is buying them. We're not big enough to sell them with an offer.

**Josh:** Right — that's something we want to be able to sell online. Like pots — why are we not selling pots online? It would still be that.

**David:** We only sell pots in the shop.

**Josh:** Because of everything in that shop, we need a tab online. Tab online is in the ERP, then in the ERP main accurate stock. Adding products like big products — you'd have plants and products. It's not impossible. Let's think about it now.

In the ERP you'd have a "shop" tab — there you could add sale items. Each item could…

**Jake:** We did talk about that. Why don't we — I think we can use API to get rid of it. Everything has a barcode, so not with ID I'm not sure. I've got a spreadsheet of every single item we buy.

**Josh:** Okay.

**Jake:** I can add an ID to that. I've put what we bought it for, what we sell it for, what the retail trace is, where we bought it from. I've got 20 tabs on the bottom — boxes, everything semi-shop. So I've done the ticket task.

**Josh:** Without that, though, it's not critical to have in. You'd have to do a click on the website. Probably more — I wanted to get there. The ERP, the platform.

**Jake:** Total stage two, because that's really… probably a bit trendy.

**Josh:** Yes — I don't know what it's going to be. I know it's going to be easy. It's going to be a fiddly thing for sure. I'll have to do this. We may have to move the EPOS system as well. EPOS now — if we want all the data on the ERP, then EPOS, ERP… I don't know.

**Jake:** Yes — that was the concern I had.

**Josh:** I've also created a stage two document. I can share it with you. The to-do list will change completely based on the first thing. When you start using the ERP, you're going to have a list of priorities of things you want.

In stage one, how are we going to manage nursery stock?

**Jake:** It goes to the — we've got what we're working on soon.

**Josh:** Would it be possible to literally remove "shop" as a location, and when you take plants to the shop, you remove them from the ERP?

**Jake:** But then — just like seeing our sales — your retail sales and your EPOS sales will be different. You'll have online sales, trade sales (ERP), and shop sales.

### **Identifiers — barcodes vs IDs**

**Josh:** What integrations could you do between EPOS now and what we're going to do? Just an investigation. That could resolve all problems — if you could just do an API call so that you scan the barcode, the sale goes through, the product on the EPOS is removed from stock; then that powers up the sales from the retail side, and on the digital product we have EPOS, you can see a wide feed of what sells.

**Jake:** Cool.

**Josh:** I'll look into it. I think it'll be a tricky integration. Right now we don't have barcodes on the plants. We've started barcodes in the shop — even Gila IDs or something. But we're not going to have barcodes on the plants in the nursery.

**Jake:** No.

**Josh:** The key thing is to have a source of truth. Is it the plant ID? Is it the barcode? A barcode is — I know a barcode, but that's a number too.

**David:** We're probably best to ID, because that wouldn't change. The barcode could change — or be a new barcode for a specific…

**Josh:** Yes — because the key thing to link EPOS to ERP is some sort of ID for a specific thing. So that would be the barcode.

**Jake:** Okay — because if we're choosing a source of truth, we ideally want it not to change. For example, the stock we buy from West comes pre-barcoded, for a 5-by-back tone — almost the same as a single plant pot size. If you have a plant 7cm — that's how we're going to identify our products.

**Josh:** I don't know how you generate a scheme, but there should be a pattern.

**Jake:** Products like garden soil that you buy in have a scheme number?

**Josh:** Yes — but I don't want to make all the schemes look the same as long as I say we need between each. Up here we need — yes, it's got an ID, and you want to be able to view and edit this ID. Is it just like, no, you don't want to, because it's given.

---

*End of transcript.*

