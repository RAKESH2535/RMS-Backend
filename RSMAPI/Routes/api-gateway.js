// importing modules
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const sha256 = require("sha256");
const uniqid = require("uuid");

// creating express application
const router = express();

router.post("/api-gateway", async (req, res) => {
  try {
    const merchantTranscationId = req.body.transcationId;
    const data = {
      merchantId: uniqid(),
      merchantTranscationId: merchantTranscationId,
      merchantUserId: req.body.MUID,
      name: req.body.name,
      amount: req.body.amount * 100,
      redirectUrl: `http://localhost:3000/api/status/${merchantTranscationId}`,
      redirectMode: "POST",
      mobileNumber: req.body.mobileNumber,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };
    const payload = JSON.stringify(data);
    const payloadMain = Buffer.from(payload).toString("base64");
    const keyIndex = 1;
    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const prodUrl = "https://api.phonepe.com/apis/hermes/pg/v1/pay";
    const options = {
      method: "POST",
      url: prodUrl,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };

    axios
      .request(options)
      .then((response) => {
        console.log(response.data);
        return res.redirect(
          response.data.data.instrumentResponse.redirectInfo.url
        );
      })
      .catch((error) => {
        res.status(500).json({
          message: `Error Occured, During transcation ${error}`,
        });
      });
  } catch (error) {
    res.status(500).send({
        message:error.message,
        success:false
    })
  }
});

router.post('/api/check-status',async(req,res)=>{
    const merchantTranscationId = res.req.body.merchantTranscationId
    const merchantId = res.req.body.merchantId

    const keyIndex = 1;
    const string = `/pg/v1/status/${merchantId}/${merchantTranscationId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    const options = {
        method:'GET',
        url:`https://api.phonepe.com/apis/hermes/pg/v1/pay/${merchantId}/${merchantTranscationId}`,
        headers:{
            accept:'application/json',
            'Content-Type':'application/json',
            'X-VERIFY':checksum,
            'X-MERCHANT-ID':`${merchantId}`
        }
    }

    axios.request(options).then(async(response)=>{
      if(response.data.sucess === true)
      {
        const url = `http://localhost:3000/success`
        return res.redirect(url)
      }
      else{
        const url = `http://localhost:3000/failure`
      }
    })
})
