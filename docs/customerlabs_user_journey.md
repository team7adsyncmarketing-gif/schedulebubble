# CustomerLabs Onboarding Journey: A Step-by-Step Guide

If your clients were to use CustomerLabs directly (or if you wanted to replicate this UX inside ScheduleBubble), this is the exact journey they take from signing up to syncing their first offline lead.

---

## 1. Sign Up & Workspace Creation
When a marketer visits CustomerLabs, they create an account and define their **Workspace**. This is the central hub where all their data will flow.

*   **Action:** The user enters their company details and selects their primary goal (e.g., "Improve Lead Quality," "Increase ROAS," or "Fix Tracking Issues").

## 2. Phase 1: Connecting "Sources" (Where the data comes from)
CustomerLabs needs to know what happens on the client's website and what happens in their CRM. 

*   **Website Tracking:** CustomerLabs provides a small snippet of JavaScript (similar to a Facebook Pixel). The client copies and pastes this code into the `<head>` of their website. This code silently tracks visitor behavior and captures hidden IDs (like the `fbclid` from Facebook ads).
*   **Connecting the CRM:** The client navigates to the **Sources** tab.
    *   They click **"Add Source"** and select their CRM (e.g., HubSpot, Salesforce, GoHighLevel).
    *   They authenticate via OAuth (clicking a button to log into their CRM and grant permissions) or by pasting an API key.
    *   If they use a custom or unknown CRM, CustomerLabs provides a **Webhook URL**. The client goes into their CRM and sets up a rule: *"Whenever a lead status changes, send an alert to this Webhook URL."*

## 3. Phase 2: Mapping the Data (Identity Resolution)
Because the website and the CRM are two different systems, the user must tell CustomerLabs how to link them together.

*   **Action:** The user goes to a mapping screen. They tell CustomerLabs:
    *   *"When a webhook comes from my CRM, the field called `Email_Address` should match to the user's `Email`."*
    *   *"The field called `Contact_Number` should match to `Phone`."*
*   **Result:** CustomerLabs now knows how to stitch a website visitor and a CRM lead into a single profile.

## 4. Phase 3: Connecting "Destinations" (Where the data goes)
Now that CustomerLabs is receiving CRM updates, it needs permission to send that data to the advertising platforms.

*   **Action:** The client navigates to the **Destinations** tab and selects **Meta / Facebook Ads**.
*   **Authentication:** They click "Authenticate with Facebook." This opens a secure popup where they log into their Meta Business Manager.
*   **Selection:** They select their Ad Account, their Meta Pixel, and authorize the **Conversions API**. (They use a secure "System User" token so CustomerLabs has Admin rights to send data).

## 5. Phase 4: Event Configuration (Signal Engineering)
This is the most critical step. The client must define *which* CRM updates should be sent to Facebook.

*   **Action:** The client creates an Event Rule. 
*   **Example Rule:** 
    *   *IF* CRM Lead Status changes to -> "Qualified Lead"
    *   *THEN* Send an event to Meta Ads called -> "Qualified_Lead_Event"
*   They intentionally *exclude* junk leads from this rule. If a lead status is marked "Junk," no signal is sent to Facebook.

## 6. The Final Result (Live Mode)
Once toggled ON, the system runs automatically in the background. 
1.  A user clicks a Facebook Ad.
2.  CustomerLabs tracks them landing on the site.
3.  They fill out a form (Junk or Good).
4.  A sales rep calls them and changes their status in the CRM.
5.  CustomerLabs detects the change.
6.  If the status is "Qualified," CustomerLabs instantly sends a secure API message to Facebook saying: *"User X is a Qualified Lead."*
7.  Facebook's algorithm learns from User X and starts hunting for better audiences.
