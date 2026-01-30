import { defineRelations } from "drizzle-orm"
import * as schema from "./schema"

export const relations = defineRelations(schema, (r) => ({
  users: {
    // One user has many transactions
    transactions: r.many.transactions(),
    // One user has many reports
    reports: r.many.reports(),
    // One user has one report settings (one-to-one)
    reportSettings: r.one.reportSettings({
      from: r.users.id,
      to: r.reportSettings.userId,
    }),
  },
  transactions: {
    // Each transaction belongs to one user
    user: r.one.users({
      from: r.transactions.userId,
      to: r.users.id,
    }),
  },
  reports: {
    // Each report belongs to one user
    user: r.one.users({
      from: r.reports.userId,
      to: r.users.id,
    }),
  },
  reportSettings: {
    // Each report setting belongs to one user
    user: r.one.users({
      from: r.reportSettings.userId,
      to: r.users.id,
    }),
  },
}))
