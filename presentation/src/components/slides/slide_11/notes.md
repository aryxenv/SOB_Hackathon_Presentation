# Dashboard demo

This slide is the prototype. Do not explain every control before showing it. Start with the idea: if SOB tracks supporter behavior, the team can sort and filter for the best next outreach.

Demonstrate search, filters, sorting by likelihood or donations, and row expansion. The key message is that the dashboard turns raw support history into action: who to contact first, why they are likely to return, and which sport or event makes the ask more relevant.

## How "Likelihood" is calculated

Right now the likelihood score is a deterministic math function over the data we already have — donation count, recency, average gift, sport alignment. That's enough to rank sponsors usefully today, with zero extra data collection.

The same column becomes the entry point for **machine learning** the moment SOB has enough signal: every gift, every conversion, every drop-off feeds a model that learns *which* combination of features actually predicts the next gift for this org specifically. The UI stays identical — the speaker can swap the brain underneath without changing the table.
