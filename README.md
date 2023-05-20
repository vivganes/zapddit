# zapddit

A reddit-style nostr client

 * [reddit Vs. zapddit](#reddit-vs-zapddit)
 * [Screenshot](#screenshot)

## reddit Vs. zapddit

**reddit** | **zapddit**
---------- | ------------
Users search for sub-reddits like r/nostr, r/tifu, etc. and follow them. | Users search for hashtags like #coffeechain, #foodstr, etc. and follow them.
Home feed is filled with posts from their subscribed sub-reddits. |User's feed is filled with recent notes mentioning the followed hashtags, in the reverse-chronological order.
Users express appreciation through upvotes. | Users express appreciation through Upzaps. Sats in the Upzaps are sent to the **author of the upzapped note**.
Users express disagreement through downvotes | Users express disagreement through Downzaps.  Sats in the Downzaps are sent to the **Downzap recipient**, who is a nostr user chosen by the down-zapper
Users see a tally of upvotes vs downvotes for each post | Users see a tally of upzap sats and downzap sats for each note

## Screenshot
![Screenshot](https://github.com/vivganes/zappedit/assets/2035886/72e75686-cc5f-4982-ad0d-76444db228bb)

## Features Checklist
  - [x] NIP-07 login
  - [x] Search hashtag
  - [x] Follow, Unfollow hashtag
  - [x] Feed with notes
  - [x] Hashtags linking
  - [x] Image display in note
  - [x] Set a downzap recipient
  - [x] Upzaps and Downzaps using QR Code
  - [x] Open user profile/post in snort
  - [x] Show user mentions in notes
  - [x] Load images only for notes by 'followed' users
  - [x] Switch light mode/dark mode
  - [x] Mute Hashtags
  - [ ] Show note mentions
  - [ ] Relay list
  - [ ] Configure multiple downzap recipients - Exact recipient randomly chosen during the downzap
  - [ ] Anything else? Feel free to suggest!


