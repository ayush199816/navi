db.users.updateOne({email: "admin@navigatio.com"}, { $set: { role: "admin", isApproved: true } });
db.users.updateOne({email: "operations@navigatio.com"}, { $set: { role: "operations", isApproved: true } });
db.users.updateOne({email: "sales@navigatio.com"}, { $set: { role: "sales", isApproved: true } });
db.users.updateOne({email: "agent@navigatio.com"}, { $set: { role: "agent", isApproved: true } });
