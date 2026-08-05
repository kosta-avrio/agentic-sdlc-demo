import express from "express";
import { DEFAULT_CONFIG, dailyTotal, tripFare, Trip } from "./fares";
import { applyPromo, registerPromo } from "./promocodes";

const app = express();
app.use(express.json());

// Seed a launch promo.
registerPromo({
  code: "WELCOME10",
  discountPercent: 10,
  expiresOn: "2026-12-31",
  singleUse: true,
});

/**
 * POST /fare
 * { originZone, destinationZone, startTime, promoCode?, riderId? }
 */
app.post("/fare", (req, res) => {
  const trip: Trip = {
    originZone: parseInt(req.body.originZone),
    destinationZone: parseInt(req.body.destinationZone),
    startTime: new Date(req.body.startTime),
  };

  let fare = tripFare(trip);

  if (req.body.promoCode) {
    fare = applyPromo(fare, req.body.promoCode, req.body.riderId);
  }

  res.json({ fare });
});

/**
 * POST /daily-total
 * { trips: [{ originZone, destinationZone, startTime }, ...] }
 */
app.post("/daily-total", (req, res) => {
  const trips: Trip[] = req.body.trips.map((t: any) => ({
    originZone: parseInt(t.originZone),
    destinationZone: parseInt(t.destinationZone),
    startTime: new Date(t.startTime),
  }));

  res.json({ total: dailyTotal(trips), cap: DEFAULT_CONFIG.dailyCap });
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`transit-fare-service listening on :${port}`);
  });
}

export default app;
