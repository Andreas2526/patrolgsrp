const express = require('express');
const cookieParser = require('cookie-parser');
const discordAuthRoutes = require('./routes/discordAuth');
const zonesRoutes = require('./routes/zones');

const app = express();

app.use(cookieParser());
app.use('/auth', discordAuthRoutes);
app.use('/', zonesRoutes);

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Auth server listening on port ${port}`);
  });
}
