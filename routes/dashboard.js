let express    = require('express'),
		router  	 = express.Router(),
		middleware = require('../middleware'),
		hubieApi 	 = require('../models/hubie-interface').connect(),
		moment 		 = require('moment');
		fs  = require('fs');

moment.locale('sr');

// show landing page
router.get('/', function(req, res) {
	let resultObj = {};
	console.log(' / ruta ', req.query);

  hubieApi.vratiRS(1, 4, '350950', 'm_radnik_SisPosao', 52)
		.then(result => {
			resultObj.supervisorData = result.recordset[0];
			// calling hubieApi.vratiPodredjeneRadnike() returns a new Promise
			return hubieApi.vratiPodredjeneRadnike(1, 4, 350950);
		})
		.then(result => {
			resultObj.subordinates = result.recordset;
			res.json(resultObj);
		})
		.catch(err => {
			console.log(err);
		});
});

router.get('/rptDnevniPregledRute/:Fk_Prodavac', function(req, res) { // Fk_Prodavac je Fk_Radnik za 'vratiRS' rute
  hubieApi.rptDnevniPregledRute(1, 16, 4, req.params.Fk_Prodavac, req.query.date)
		.then(r => res.json(r.recordset))
		.catch(err => console.log('/rptDnevniPregledRute/:Fk_Prodavac', req.query, req.params, err));
});

router.get('/route-details/:Fk_Partner', middleware.isLoggedIn, async (req, res) => { // Fk_Partner iz 'rptDnevniPregledRute' rute
	try {
		if (req.query.Fk_Pozicija) {
			// console.log('/route-details/:Fk_Partner, req.query', req.query);
			const r = await hubieApi.getPodaciPartnerPozicijaSlikeNew(1, 4, req.params.Fk_Partner, req.query.Fk_Pozicija, req.query.date) // BORCA
			r.recordset.forEach((slika, i) => {
				const fileName = req.params.Fk_Partner + `_` +slika.Fk_PartnerPozicija+ `_` +i+ `.jpg`
				const filePath = __dirname + `/../public/images/` + fileName;
				fs.writeFileSync(filePath, slika.Slika); // saveImage as file in /public ... TODO remove all old images
				if (slika.Slika)
					slika.Slika = `/images/` + fileName; // replace binary image with image URL
			});
			res.json(r.recordset);
		} else if (req.query.Zalihe) {
			// TODO input fiskalna godina
			const r = await hubieApi.vratiZalihePartnerOS(1, 4, 16, req.params.Fk_Partner, req.query.date);
			res.json(r.recordset);
		} else {
			const r = await hubieApi.getPodaciPartnerPozicija(1, 4, req.params.Fk_Partner, req.query.date) // BORČA
			res.json(r.recordset);
		}
	} catch (err) {
	  next(err);
	}
});

module.exports = router;