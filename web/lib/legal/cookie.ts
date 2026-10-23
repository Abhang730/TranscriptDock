import { OPERATOR_EMAIL } from "./shared";

export const cookie = {
  title: "Cookie and Tracking Notice",
  intro: `This notice explains the cookies and similar tracking we use on TranscriptDock.`,
  sections: [
    { heading: "What cookies are", body: `Cookies are small pieces of data stored by your browser. We use them to keep the site working, to remember your session where needed, and to understand how the site is being used.` },
    { heading: "Essential cookies", body: `We use essential cookies for authentication and session functionality provided through Supabase Auth. These cookies are necessary for signed-in features to work and for the site to function as you expect.` },
    { heading: "Analytics and usage", body: `We may use analytics to understand traffic, errors, and how people use the site. Where we do, we aim to keep the data limited to what is needed for those purposes. Analytics should not be treated as a substitute for securing the service or protecting user data.` },
    { heading: "What we do not do", body: `We do not publish your transcripts on any public index, we do not expose your transcripts to other users, and we do not use tracking to share personal transcript content with advertisers or unrelated third parties.` },
    { heading: "Your choices", body: `You can control cookies through your browser settings. If you block essential cookies, signed-in features may not work correctly. If you block analytics cookies, the site may still work, but we may have less insight into usage and errors.` },
    { heading: "Updates to this notice", body: `We may update this notice when we add or change tracking. The current version is shown on this page.` },
    { heading: "Questions", body: `If you have questions about cookies or tracking, email ${OPERATOR_EMAIL}.` },
  ],
};
