# Donation forecast — financial impact

This slide turns the donation app demo into a number. It is a revenue scenario
analysis, not a promise: three honest cases sized off the same simple formula so the
room can judge the upside for themselves.

Press Space to walk Conservative → Realistic → Optimistic. Anchor on **Realistic** as
the headline you actually believe (~€18.7k/yr by Year 3), use Conservative to show the
floor is still self-funding, and use Optimistic only to show the ceiling if the app
reaches scale.

## How the numbers are built

Every figure comes from one formula, applied per year:

```
annual revenue = MAU × conversion % × avg monthly donation × 12
```

The only thing that changes between scenarios is the three inputs:

| Scenario     | MAU Y1 | Conversion | Avg donation | Year 3 revenue |
|--------------|--------|------------|--------------|----------------|
| Conservative | 2,000  | 0.5%       | €10 / mo     | €1,872         |
| Realistic    | 10,000 | 1.0%       | €10 / mo     | €18,720        |
| Optimistic   | 50,000 | 2.0%       | €10 / mo     | €187,200       |

Year-over-year we assume MAU growth of **+20% in Year 2** and **+30% in Year 3** — the
same growth curve applied to all three scenarios, so the difference you see is driven by
the starting assumptions, not by cherry-picked growth.

Source model: `App_Forecast_Model.xlsx`.

## Talking points
- These are recurring donations, so the figure compounds with retention — this is a
  revenue stream, not a one-off campaign.
- The inputs are levers SOB controls: app reach (MAU), how good the ask is (conversion),
  and donation framing (avg gift). The dashboard from the previous slides is what moves
  conversion.
- Even the Conservative floor covers the app's running cost, so the downside is contained.
