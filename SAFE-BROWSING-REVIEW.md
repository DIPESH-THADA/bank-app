# Safe Browsing review

Chrome reported phishing for the public site. A successful deployment does not mean Google has removed that classification. The exact flagged URLs and Google's details must be checked by the verified site owner in Search Console.

## Changes prepared for review

- Clearly identify Dipesh Thada as the operator of an unofficial student project on every app page.
- Explain that the site is not affiliated with or operated by Rastriya Banijya Bank.
- Label registration and sign-in as demo-only and tell visitors not to reuse banking credentials.
- Add a Try demo account button using the public seeded demo account.
- Replace bank-style promotional language and publish an independent-project explanation at `/about-demo.html`.
- Exclude unused original bank imagery from the published build and label the custom artwork as demonstration artwork.

These changes address confusing presentation; they are not proof that Google's classification was mistaken, and they do not guarantee delisting.

## Owner action required

1. Open https://search.google.com/search-console and add the URL-prefix property `https://rastriya-banijya-bank-rbb.netlify.app/`.
2. Complete Google's ownership verification. Its HTML file or meta-tag method can be added to this project if needed.
3. Open **Security & Manual Actions > Security issues**. Inspect all listed sample URLs and resolve any additional issues Google identifies.
4. Request a review after confirming the issues are fixed. Review may take several days.

Suggested factual description (adjust for any additional findings):

> This is an independent student banking UI project operated by Dipesh Thada. We clarified the project identity and lack of affiliation with the real bank, removed bank-service promotional claims and unused bank imagery from the published build, added demo-only sign-in and registration messaging, and added an explanation page at /about-demo.html. The project provides simulated accounts and money only. Please review the updated site and report any remaining flagged content.

Do not disable Safe Browsing or change domains to avoid the warning.

Google's guidance: https://developers.google.com/search/docs/monitor-debug/security/social-engineering
