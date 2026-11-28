import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHeader, Prose } from "@/components/ui/Layout";
import { COMPANY, SITE } from "@/lib/config";
import { AGREEMENT_VERSION } from "@/lib/portal";

const EFFECTIVE = "28 November 2026";
const NAME = COMPANY.legalName;
const Mail = ({ subject }: { subject?: string }) => (
  <a href={`mailto:${SITE.contactEmail}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`}>{SITE.contactEmail}</a>
);

/** Venue for disputes, used by every contract on this page. */
const DISPUTES = (
  <>
    <p>
      These terms are governed by the laws of India. The parties will first try to settle any dispute by good-faith discussion between senior people for 30 days. A dispute not settled that
      way is referred to arbitration by a sole arbitrator appointed by agreement under the Arbitration and Conciliation Act, 1996. The seat of arbitration is the city of {NAME}&apos;s
      registered office, the language is English, and the award is final and binding. Subject to that, the courts at that city have exclusive jurisdiction, including for urgent interim relief.
    </p>
  </>
);

const DOCS = {
  terms: {
    title: "Terms of sale for buyers",
    summary: "How quotations, orders, payment, delivery, inspection, warranty and liability work when you buy parts from Timule.",
    body: (
      <>
        <h2>1. Who these terms are between</h2>
        <p>
          These terms apply to every sale of parts by {NAME} (&quot;Timule&quot;, &quot;we&quot;) to a business customer (&quot;you&quot;). They form the contract together with our
          quotation and your accepted purchase order. If those documents conflict, this order of precedence applies: (1) a written agreement signed by both parties, (2) our quotation, (3)
          these terms, (4) your purchase order. Terms printed on your purchase order or portal do not apply unless we agree to them in writing. We sell only to businesses, not to consumers.
        </p>

        <h2>2. Codes, build sheets and what you are buying</h2>
        <ul>
          <li>Every part is identified by a Timule part code (for example TM-MOT-6015-150-A) and is built to the build sheet revision current on the date of our quotation.</li>
          <li>We choose and manage the qualified maker for each code. Makers are identified to you only by their TMS supplier code. You buy from Timule, and Timule is responsible to you.</li>
          <li>We may change a maker or a sub-component without notice if the part still meets every band on the build sheet. Any change to form, fit, function or declared origin moves the revision letter and is notified to you before we ship it.</li>
        </ul>

        <h2>3. Requests, reservations and quotations</h2>
        <ul>
          <li>A request (TMQ) is an enquiry. A reservation (TMR) is a non-binding letter of intent that helps us plan capacity. Neither commits you or us to a sale.</li>
          <li>A quotation (TMO) states prices per code, quantities, GST, lead time, delivery terms and validity. It is valid for 15 days unless it says otherwise.</li>
          <li>A contract is formed when we accept your purchase order quoting our TMO number, in writing or by email. We may decline any order.</li>
          <li>Samples, prototypes and pilot quantities are supplied for evaluation, and the warranty in section 8 applies to them only as the quotation states.</li>
        </ul>

        <h2>4. Prices and payment</h2>
        <ul>
          <li>Prices are in Indian rupees and exclude GST, other taxes, duties, freight and insurance unless the quotation says they are included. GST is charged at the rate in force on the invoice date.</li>
          <li>Unless the quotation says otherwise: 50 % of the order value is due with the order and the balance before dispatch. Lead times run from receipt of the advance.</li>
          <li>Pay to the bank account printed on our invoice (TMI). We never change bank details by email alone: confirm any change by phone with us before paying.</li>
          <li>Late payments carry interest at 18 % a year from the due date. We may hold deliveries while any amount is overdue.</li>
          <li>If raw-material prices or exchange rates move by more than 5 % between quotation and order, we may revise the price for orders not yet accepted.</li>
        </ul>

        <h2>5. Delivery, risk and title</h2>
        <ul>
          <li>Delivery is on the terms stated in the quotation. Where none are stated, delivery is to the address on your purchase order by a carrier we choose.</li>
          <li>Delivery dates are our best estimate. We tell you promptly about any delay. If a confirmed date slips by more than 30 days for reasons within our control, you may cancel the delayed lines and receive a full refund of any amount paid for them.</li>
          <li>Risk passes to you on delivery. Ownership passes to you when we receive full payment for the parts.</li>
          <li>Each delivery carries a delivery note with the TM codes, quantities and batch numbers. Batch test records and origin declarations are sent with the delivery or made available on request.</li>
        </ul>

        <h2>6. Inspection and acceptance</h2>
        <ul>
          <li>Inspect each delivery when it arrives. Report shortages, wrong parts or visible transit damage within 7 days of delivery through the <Link href="/complaint">complaint form</Link> (TMC), with photos of the packaging and labels.</li>
          <li>Parts are accepted if you do not report a non-conformity within 30 days of delivery, or when you put them into production, whichever comes first. Latent defects remain covered by the warranty.</li>
          <li>Acceptance is measured against the acceptance bands on the build sheet for the code and revision ordered, using the test methods stated there.</li>
        </ul>

        <h2>7. Batch testing</h2>
        <p>
          Every batch is tested against the acceptance bands on the build sheet before it leaves us, and only parts inside every band are released. The test record is filed under the TM code
          and batch. This is how we work; it does not replace your own incoming inspection where your quality system requires one.
        </p>

        <h2>8. Warranty</h2>
        <ul>
          <li>We warrant that each part, when delivered, conforms to the build sheet for its code and revision and is free from defects in materials and workmanship, for 12 months from delivery or the period stated in the quotation.</li>
          <li>The warranty does not cover: damage from crashes, impact, water or dust ingress beyond the rated protection, use outside the ratings on the build sheet (voltage, current, temperature, load), incorrect installation, firmware or settings you changed, modification or repair by others, improper storage, or normal wear of wear parts such as propellers and bearings.</li>
          <li>Your remedy for a part that fails the warranty is, at our choice, repair, replacement or a credit or refund of the price paid for that part, together with the reasonable cost of returning it. This is your only remedy for defective parts, to the extent the law allows.</li>
          <li>Origin and indigenous-content statements are made in good faith from the makers&apos; declarations and our own checks, as recorded on the evidence pages. Where a tender requires your own declaration, you remain responsible for it.</li>
        </ul>

        <h2>9. Returns</h2>
        <p>
          Report a problem first: do not send parts back without a TMC number. How we investigate, what we replace and who pays freight is set out in our{" "}
          <Link href="/legal/returns">complaints and returns policy</Link>, which forms part of these terms.
        </p>

        <h2>10. Use of the parts and export control</h2>
        <ul>
          <li>You are responsible for using the parts lawfully and safely, and for the certification of any product you build with them, including under the Drone Rules, 2021 and DGCA requirements where they apply.</li>
          <li>Some parts may be controlled items under India&apos;s SCOMET list or the export rules of other countries. You will not export, re-export or transfer them in breach of those rules, or to any person on a sanctions list, and you will give us end-use information when we ask for it.</li>
          <li>Parts are not designed or tested for life-support, manned aviation or nuclear applications unless the quotation says so in writing.</li>
        </ul>

        <h2>11. Limitation of liability</h2>
        <ul>
          <li>Our total liability under or in connection with an order is limited to the price paid for the parts that gave rise to the claim.</li>
          <li>Neither party is liable for loss of profit, revenue, business, contracts or data, or for any indirect or consequential loss, however caused.</li>
          <li>Nothing in these terms limits liability for death or personal injury caused by negligence, for fraud, or for anything else the law does not allow to be limited.</li>
        </ul>

        <h2>12. Confidentiality and intellectual property</h2>
        <ul>
          <li>Each party keeps the other&apos;s non-public information (prices, quantities, drawings, build sheets, roadmaps) confidential and uses it only for the order, during the relationship and for 3 years after it.</li>
          <li>Timule part codes, build sheets, drawings, 3D models and documents remain ours. Your designs and specifications remain yours. Buying parts does not transfer any intellectual property, but you may use and resell the parts you buy.</li>
        </ul>

        <h2>13. Force majeure</h2>
        <p>
          Neither party is liable for a delay or failure caused by events beyond its reasonable control, such as natural disasters, epidemics, war, government action, strikes outside its own
          workforce, or failure of public utilities or carriers. The affected party will notify the other promptly and do what it reasonably can to limit the effect. If the event lasts more than
          60 days, either party may cancel the affected order lines without liability, and any advance for undelivered parts is refunded.
        </p>

        <h2>14. Cancellation</h2>
        <p>
          You may cancel an accepted order only with our written agreement. Parts already built or materials bought for your order may be charged. Custom builds and parts made to your own
          specification cannot be cancelled once production has started.
        </p>

        <h2>15. General</h2>
        <ul>
          <li>Neither party may assign an order without the other&apos;s consent, except Timule to a successor of its business.</li>
          <li>If any part of these terms is unenforceable, the rest remains in force. A failure to enforce a right is not a waiver of it.</li>
          <li>Notices are given by email to the addresses used for the order, and to <Mail /> for Timule.</li>
        </ul>

        <h2>16. Law and disputes</h2>
        {DISPUTES}
      </>
    ),
  },

  "supplier-terms": {
    title: "Supplier terms",
    summary: "What Timule expects from every maker: onboarding, quality, batch testing, honest origin, confidentiality and how orders and payment work.",
    body: (
      <>
        <p>
          Version <strong>{AGREEMENT_VERSION}</strong>. These terms apply between {NAME} (&quot;Timule&quot;, &quot;we&quot;) and every company that supplies or applies to supply us
          (&quot;supplier&quot;, &quot;you&quot;). You accept them in the supplier portal, by a person authorised to bind your company, and they apply to every purchase order (TMP) we send
          you. A signed quality or supply agreement, or the purchase order itself, overrides them where it says something different.
        </p>

        <h2>1. Applying, onboarding and the portal</h2>
        <ul>
          <li>Applying (TMA) or being invited to the portal is free and does not oblige either side to place or accept orders.</li>
          <li>You get a supplier code (TMS). Buyers see your TMS code and the evidence recorded against it, never your company name, documents, people or prices.</li>
          <li>Portal access is personal to the Google accounts we have invited. Keep them secure, do not share them, and tell us at once if you think an account has been misused. You are responsible for what is submitted from your accounts.</li>
          <li>Everything you submit, including registrations, certificates, photos, test records, origin declarations and sample details, must be true, current and complete. Tell us within 7 days if a certificate is withdrawn, expires or changes.</li>
          <li>Photos and videos must show your own premises, equipment and products. Avoid showing people&apos;s faces; where a person can be identified, you confirm that they agreed to it.</li>
          <li>We qualify you for specific TM codes from documents, samples and, where needed, a visit to your site. Qualification can be limited, paused or withdrawn if the evidence no longer supports it.</li>
        </ul>

        <h2>2. Building to the sheet</h2>
        <ul>
          <li>Build every unit exactly to the build sheet and revision named on the purchase order.</li>
          <li>Do not change materials, sub-suppliers, processes, tooling, firmware or the place of manufacture for a qualified code without our written approval, requested at least 30 days in advance. An unapproved change is a breach even if the parts still pass.</li>
          <li>Use only new, genuine components from authorised sources. Counterfeit, recycled or re-marked components are never acceptable.</li>
          <li>Mark every unit and carton with the TM code, batch number and our TMP number. Do not add your own brand unless the order asks for it.</li>
        </ul>

        <h2>3. Testing, records and traceability</h2>
        <ul>
          <li>Test every batch against the acceptance bands on the build sheet before dispatch, with calibrated instruments, and send the batch test record with each shipment.</li>
          <li>Keep production and test records, calibration certificates and material traceability for each batch for at least 5 years, and let us see them on request.</li>
          <li>We may visit or audit your site, and witness tests, on 5 working days&apos; notice, or sooner after a serious quality problem.</li>
        </ul>

        <h2>4. Honest origin</h2>
        <ul>
          <li>Declare the origin of key materials and parts truthfully. &quot;Unknown&quot; is an acceptable answer. A wrong one is not.</li>
          <li>Our buyers rely on these declarations, including for government tenders under the Public Procurement (Preference to Make in India) Order. A false or careless declaration is a material breach: we may end our relationship at once, and you will compensate us for the losses it causes, including claims by buyers.</li>
        </ul>

        <h2>5. Acceptance, non-conformity and complaints</h2>
        <ul>
          <li>We inspect against the acceptance bands. Units outside any band are rejected.</li>
          <li>For rejected units, or units that fail at a buyer during the warranty period because of your workmanship, materials or a breach of the build sheet, you will at your cost and at our choice replace, rework or credit them, and pay the reasonable costs of return freight, sorting and re-inspection.</li>
          <li>For a customer complaint (TMC) against your parts, you will reply with a containment plan within 2 working days and a root cause and corrective action report (8D or similar) within 10 working days.</li>
          <li>Inspection and test results, complaints and on-time delivery are recorded against your TMS code and used when we allocate orders.</li>
        </ul>

        <h2>6. Orders, delivery and payment</h2>
        <ul>
          <li>We order by purchase order (TMP) stating the codes, quantities, prices, delivery date and payment terms. Confirm or decline within 2 working days.</li>
          <li>Tell us at once if a delivery date is at risk. Repeated late deliveries may reduce future allocations.</li>
          <li>Invoice us quoting the TMP number and TM codes, with a valid GST invoice. We pay on the terms in the purchase order. Where you are a micro or small enterprise registered under the MSMED Act, 2006, we pay within the period that Act requires.</li>
          <li>Risk passes to us on delivery to the address on the purchase order. Title passes on delivery, free of any claim.</li>
        </ul>

        <h2>7. Buyers and non-circumvention</h2>
        <ul>
          <li>Buyers who come to you through Timule for parts made to Timule codes are served through Timule for 24 months from your first order with us. Do not quote or sell to them directly, or through another party, in that time.</li>
          <li>Do not contact our buyers about Timule orders except through us.</li>
        </ul>

        <h2>8. Confidentiality and intellectual property</h2>
        <ul>
          <li>Build sheets, drawings, 3D models, test methods, TM codes, prices, buyer details and anything else we share are confidential. Use them only to supply Timule, share them only with your staff who need them, and keep them confidential during our relationship and for 5 years after it.</li>
          <li>Timule owns its build sheets, codes, drawings and any improvement made to them for us. You keep the intellectual property you brought to the relationship, and you grant us the right to use your submitted documents and test results to qualify you, to answer buyers and auditors, and to publish anonymised evidence under your TMS code.</li>
          <li>You confirm that what you supply does not infringe anyone else&apos;s intellectual property.</li>
        </ul>

        <h2>9. Ethics, law and safety</h2>
        <ul>
          <li>Comply with all applicable laws, including labour, minimum wage, health and safety, environmental and tax laws. No child, forced or bonded labour.</li>
          <li>No bribes or improper payments to anyone, including Timule&apos;s people, in line with the Prevention of Corruption Act, 1988. Report any request for one to <Mail subject="Ethics" />.</li>
          <li>Comply with export control and sanctions rules, including India&apos;s SCOMET list, for parts and technology you handle for us.</li>
          <li>Handle any personal data we share only for our orders and protect it as the Digital Personal Data Protection Act, 2023 requires.</li>
        </ul>

        <h2>10. Liability</h2>
        <ul>
          <li>You will compensate Timule for losses caused by defective parts, a breach of these terms, an infringement of intellectual property, or a false declaration, including reasonable claims by our buyers.</li>
          <li>Our total liability to you under any purchase order is limited to the price of that order. Neither party is liable for indirect or consequential loss, or loss of profit, except for breach of confidentiality, non-circumvention or a false declaration.</li>
          <li>Nothing limits liability for death or personal injury caused by negligence, for fraud, or where the law does not allow it.</li>
        </ul>

        <h2>11. Ending the relationship</h2>
        <ul>
          <li>Either side may stop working together on 30 days&apos; written notice. Purchase orders already accepted are completed unless we agree otherwise.</li>
          <li>We may pause your portal account or end the relationship at once for a false declaration, an unapproved change, counterfeit parts, an ethics breach, or repeated serious quality failures.</li>
          <li>When it ends, return or destroy our confidential material on request. Sections 3 (records), 4, 5, 7, 8 and 10 continue to apply.</li>
        </ul>

        <h2>12. Changes to these terms</h2>
        <p>
          We may update these terms. The portal asks you to accept each new version before you submit again; purchase orders already accepted stay under the version in force when they were
          accepted.
        </p>

        <h2>13. Law and disputes</h2>
        {DISPUTES}
      </>
    ),
  },

  privacy: {
    title: "Privacy notice",
    summary: "What personal data Timule collects, why, who processes it, how long we keep it and your rights under India's Digital Personal Data Protection Act, 2023.",
    body: (
      <>
        <h2>1. Who we are</h2>
        <p>
          {NAME} (&quot;Timule&quot;, &quot;we&quot;) runs timule.com and is the data fiduciary for the personal data described here under the Digital Personal Data Protection Act, 2023
          (&quot;DPDP Act&quot;). We supply components to businesses, so most of the data we hold is about people at companies: buyers, suppliers and investors.
        </p>

        <h2>2. What we collect, and why</h2>
        <ul>
          <li>
            <strong>Requests, reservations and quotations</strong> (TMQ, TMR): company, name, work email, role, phone if given, the parts and quantities you need, and your messages. Used to
            reply, quote, plan capacity and fulfil orders.
          </li>
          <li>
            <strong>Complaints</strong> (TMC): your contact details, order and batch numbers, a description and any photos, videos or readings you upload. Used to investigate, put things right
            and improve our parts. Makers see the complaint only by its TMC number, never your name or company.
          </li>
          <li>
            <strong>Supplier applications</strong> (TMA): company, contact details, city, what you make, capacity and the certificates you upload. Used to assess you as a supplier.
          </li>
          <li>
            <strong>The supplier portal</strong>: when you sign in with Google we receive your name and email address, only to check that you were invited. We store your company profile,
            registrations, certificates, factory and product photos and videos, test records, origin declarations, sample shipments, the name and title of the person who accepted our supplier
            terms, and a record of activity on the account. Used to qualify you, manage orders and quality, and meet our legal obligations.
          </li>
          <li>
            <strong>Investor enquiries</strong> (TMF): name, email, firm and message. Used to reply.
          </li>
          <li>
            <strong>&quot;Notify me&quot;</strong>: your email address, to tell you when a category opens. Ask us at any time to stop.
          </li>
          <li>
            <strong>Team accounts</strong>: name, username and a salted hash of the password (never the password itself), and the actions each person takes, so changes are accountable.
          </li>
          <li>
            <strong>Technical data</strong>: our hosting provider records IP addresses and requests in server logs, which we use to keep the site secure and working and to limit abuse. Our
            analytics, when enabled, are cookie-free and count page views without identifying you.
          </li>
          <li>The BOM checker, quote list and engineering tools run in your browser. Nothing you type there is sent to us until you submit a form.</li>
        </ul>
        <p>
          We process this data because you give it to us for these purposes (consent under section 6 of the DPDP Act, which you can withdraw), and where the Act allows it without consent:
          for purposes you have voluntarily provided the data for, to comply with law, and for the other legitimate uses in section 7. We do not sell personal data, use it for advertising, or
          make decisions about you by automated means alone.
        </p>

        <h2>3. Who processes it for us</h2>
        <ul>
          <li>Vercel Inc. (United States): hosting of the site and storage of records and uploaded files.</li>
          <li>Formspree (United States): delivery of form submissions to our inbox by email.</li>
          <li>Google LLC (United States): sign-in for the supplier portal. Google&apos;s own privacy policy applies to your Google account.</li>
          <li>Our email provider, for correspondence you start with us.</li>
        </ul>
        <p>
          These providers act on our instructions and are bound to protect the data. Using them means your data may be processed outside India, which the DPDP Act permits except to countries the
          Government of India restricts. We share data with others only where the law requires it, to protect our rights, or with a buyer of our business under the same protections.
        </p>

        <h2>4. How long we keep it</h2>
        <ul>
          <li>Requests and reservations that do not lead to an order: 3 years from the last contact.</li>
          <li>Orders, invoices and related correspondence: 8 years, as tax and company law require.</li>
          <li>Complaints, batch test records and quality evidence: 10 years, because they are part of the traceability of parts that may still be in use.</li>
          <li>Supplier records and portal files: for as long as we work together, then 8 years. Applications that do not lead to onboarding: 2 years.</li>
          <li>Investor enquiries: 3 years. &quot;Notify me&quot; addresses: until you unsubscribe or the category opens.</li>
          <li>Server logs: up to 30 days.</li>
        </ul>
        <p>After these periods we delete the data, or keep it only in a form that no longer identifies anyone.</p>

        <h2>5. How we protect it</h2>
        <ul>
          <li>The whole site is served over HTTPS with HSTS. Uploaded files are stored at long random addresses that are never linked from the site, and are shown only through a page that checks who is signed in.</li>
          <li>The team area and the supplier portal need a sign-in. Session cookies are signed, HttpOnly and Secure. Team passwords are stored only as salted scrypt hashes.</li>
          <li>Access to personal data is limited to the Timule team members who need it. Forms are protected against automated abuse and cross-site requests.</li>
          <li>If a personal data breach occurs, we will inform the Data Protection Board of India and the people affected as the DPDP Act requires.</li>
        </ul>

        <h2>6. Your rights</h2>
        <p>Under the DPDP Act you may:</p>
        <ul>
          <li>ask for a summary of the personal data we hold about you and how we use it, and who we have shared it with;</li>
          <li>ask us to correct, complete or update it;</li>
          <li>withdraw your consent, and ask us to erase data we no longer need or are not required by law to keep;</li>
          <li>nominate another person to exercise your rights if you die or become unable to;</li>
          <li>have your grievance addressed by us, and then, if you are not satisfied, complain to the Data Protection Board of India.</li>
        </ul>
        <p>
          Write to <Mail subject="Privacy request" /> from the email address we know you by. We reply within 30 days. Withdrawing consent does not affect processing that already took place,
          and we may still keep records the law requires.
        </p>

        <h2>7. Grievance officer</h2>
        <p>
          Aadit Patadia, Co-founder, {NAME}. Email: <Mail subject="Grievance" />. We acknowledge grievances within 48 hours and resolve them within 30 days.
        </p>

        <h2>8. Children</h2>
        <p>Timule serves businesses. The site is not meant for anyone under 18, and we do not knowingly collect their data.</p>

        <h2>9. Cookies</h2>
        <p>
          We use only the cookies the site needs to work, and no advertising or tracking cookies. See the <Link href="/legal/cookies">cookie notice</Link>.
        </p>

        <h2>10. Changes</h2>
        <p>We will update this notice when how we handle data changes, and show the date it takes effect at the top. Material changes are announced on the site and, for portal users, in the portal.</p>
      </>
    ),
  },

  "website-terms": {
    title: "Website terms of use",
    summary: "The rules for using timule.com, its engineering tools, documents and private areas.",
    body: (
      <>
        <h2>1. These terms</h2>
        <p>
          By using timule.com you agree to these terms. Buying parts is covered by the <Link href="/legal/terms">terms of sale</Link>, and supplying us by the{" "}
          <Link href="/legal/supplier-terms">supplier terms</Link>.
        </p>

        <h2>2. Information on the site</h2>
        <ul>
          <li>The catalogue, specifications and evidence pages describe our parts and the proof we hold for each claim. Each figure says whether it is stated by the maker or measured by us or a lab. They are not a warranty: the warranty is in the terms of sale.</li>
          <li>3D models and drawings are simplified illustrations, labelled as such, and are not manufacturing drawings.</li>
          <li>The engineering tools (configurators, sizing, indigenous-content calculator, firmware records, BOM checker) give estimates from the inputs you provide. Check their results against your own engineering and the rules that apply to you before you rely on them, especially for tender declarations and flight safety.</li>
          <li>We work to keep the site accurate and available but do not promise that it is free of errors or always online.</li>
        </ul>

        <h2>3. What you may and may not do</h2>
        <ul>
          <li>You may view, download and print pages, spec sheets and documents for your own business use, and share them with colleagues and customers.</li>
          <li>Do not copy the catalogue or code system in bulk, scrape the site in a way that burdens it, or present our content as your own.</li>
          <li>Do not try to get into the team area, the supplier portal or anyone else&apos;s records, probe or test the site&apos;s security, upload malware, or interfere with the site&apos;s operation.</li>
          <li>Do not submit anything false, unlawful or that you have no right to share.</li>
        </ul>

        <h2>4. Private areas</h2>
        <p>
          The team area and the supplier portal are for authorised people only. Access is personal. We may suspend any account that is misused. Tracking pages for requests and complaints
          are private links: anyone with the link can see that page, so share it with care.
        </p>

        <h2>5. Found a security problem?</h2>
        <p>
          Tell us at <Mail subject="Security report" /> with enough detail to reproduce it, and give us reasonable time to fix it before telling anyone else. Do not access or change data that
          is not yours. We will not take action against good-faith reports made this way.
        </p>

        <h2>6. Intellectual property</h2>
        <p>
          The Timule name and mark, the TM code system, build sheets, documents, text, tools and design of the site belong to {NAME}. Other names and marks belong to their owners.
        </p>

        <h2>7. Links</h2>
        <p>Links to other sites are for convenience. We are not responsible for their content.</p>

        <h2>8. Liability</h2>
        <p>
          The site is provided as it is. To the extent the law allows, we are not liable for loss arising from use of the site or reliance on its tools or content. Nothing limits liability
          that the law does not allow to be limited.
        </p>

        <h2>9. Law and disputes</h2>
        {DISPUTES}
      </>
    ),
  },

  returns: {
    title: "Complaints, returns and warranty claims",
    summary: "How to report a problem with a part, how fast we respond, how we investigate and what we put right.",
    body: (
      <>
        <h2>1. Report it first</h2>
        <ul>
          <li>
            Use the <Link href="/complaint">complaint form</Link>. You get a TMC complaint number and a private page that shows every step. Quote the TM code, the batch number from the label and
            your invoice or order number, and add photos, videos or readings.
          </li>
          <li>Report shortages, wrong parts and visible transit damage within 7 days of delivery. Report other defects as soon as you find them, within the warranty period.</li>
          <li>Keep the affected units, their packaging and labels. Do not open, rework or modify them, and do not send anything back until we give you return instructions under the TMC number.</li>
        </ul>

        <h2>2. How fast we respond</h2>
        <ul>
          <li>A first answer within 1 working day, or within 4 working hours when you mark a safety risk or a stopped line.</li>
          <li>Containment, such as sorting stock or shipping replacements, within 2 working days where the fault is confirmed or likely.</li>
          <li>A root cause and corrective action report within 10 working days for a confirmed defect.</li>
        </ul>

        <h2>3. How we investigate</h2>
        <p>
          We pull the batch test record for the code and batch, test the returned units against the build sheet bands, and work through the cause with the maker, who sees only the TMC number.
          The finding and the corrective action are filed under the TM code and batch, and future batches are tested for it.
        </p>

        <h2>4. What we put right</h2>
        <ul>
          <li>Where a part does not meet the build sheet or the warranty, we repair, replace or credit it, at our choice, and pay the reasonable cost of return freight.</li>
          <li>Shortages are shipped, and wrong parts exchanged, at our cost.</li>
          <li>Where a returned unit is found to meet the build sheet, or the fault falls outside the warranty (for example crash damage, over-voltage, modification or misuse), we send you the test result, return the unit at your cost or dispose of it on your instruction, and may charge a reasonable test fee that we will tell you before testing.</li>
          <li>Refunds and credits are issued against the original invoice within 14 days of the decision.</li>
        </ul>

        <h2>5. Returns that are not faults</h2>
        <p>
          Parts in good order can be returned only with our written agreement, unused, in their original packaging, within 30 days of delivery. A restocking charge of up to 15 % may apply.
          Custom builds and parts made to your specification cannot be returned unless they are defective.
        </p>

        <h2>6. Safety notices</h2>
        <p>
          If we find a defect that could affect safety, we will tell every affected buyer by email, by TM code and batch, with what to do. Keep your contact details with us current so we can
          reach you.
        </p>

        <p>
          These steps form part of the <Link href="/legal/terms">terms of sale</Link>. Questions: <Mail subject="Complaints and returns" />.
        </p>
      </>
    ),
  },

  cookies: {
    title: "Cookie notice",
    summary: "The only cookies timule.com uses, and what the site stores in your browser.",
    body: (
      <>
        <p>timule.com uses no advertising, profiling or third-party tracking cookies. It sets cookies only when you sign in, because the site cannot work without them, so no consent banner is needed.</p>
        <h2>Cookies</h2>
        <ul>
          <li>
            <strong>__Host-timule_session</strong>: keeps a team member signed in to the team area. Signed, HttpOnly, Secure, SameSite=Strict. Lasts 7 days, or until you sign out.
          </li>
          <li>
            <strong>__Host-timule_supplier</strong>: keeps a supplier signed in to the portal. Signed, HttpOnly, Secure, SameSite=Lax. Lasts 14 days, or until you sign out.
          </li>
          <li>
            <strong>__Host-timule_oauth</strong>: a one-time value that protects Google sign-in from forgery. Lasts 10 minutes and is deleted when sign-in finishes.
          </li>
        </ul>
        <h2>Stored in your browser</h2>
        <ul>
          <li>Your light or dark theme choice, your quote list and form drafts are kept in your browser&apos;s local storage. They never leave your device unless you submit a form. Clear them from your browser settings at any time.</li>
        </ul>
        <h2>Analytics</h2>
        <p>When analytics are enabled we use a cookie-free service that counts page views and a few anonymous events. It sets no cookies and does not identify you.</p>
        <p>
          More in the <Link href="/legal/privacy">privacy notice</Link>.
        </p>
      </>
    ),
  },
} as const;

type DocKey = keyof typeof DOCS;
const ORDER: DocKey[] = ["terms", "returns", "supplier-terms", "privacy", "cookies", "website-terms"];

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  const d = DOCS[doc as DocKey];
  return d ? { title: d.title, description: d.summary, alternates: { canonical: `/legal/${doc}` } } : {};
}

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = DOCS[doc as DocKey];
  if (!d) notFound();
  return (
    <>
      <PageHeader eyebrow={<span>Legal · in effect from {EFFECTIVE}</span>} title={d.title} lead={d.summary} />
      <Container className="grid grid-cols-1 gap-12 pb-24 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Prose>{d.body}</Prose>
          <p className="mt-14 border-t border-line pt-6 text-sm text-fg-subtle">
            {NAME} · in effect from {EFFECTIVE}. Questions about this document: <Mail subject={d.title} />.
          </p>
        </div>
        <nav aria-label="Legal documents" className="lg:col-span-4">
          <div className="rounded-xl border border-line p-5 lg:sticky lg:top-24">
            <p className="text-sm font-semibold">Legal documents</p>
            <ul className="mt-3 space-y-1">
              {ORDER.map((k) => (
                <li key={k}>
                  <Link
                    href={`/legal/${k}`}
                    aria-current={k === doc ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${k === doc ? "bg-bg-subtle font-medium text-fg" : "text-fg-muted hover:bg-bg-subtle hover:text-fg"}`}
                  >
                    {DOCS[k].title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </Container>
    </>
  );
}
