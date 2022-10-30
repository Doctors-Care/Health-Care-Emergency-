// //Controller related to Admin ressource.
const db = require("../Database/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { sendConfirmationMail } = require("./nodemailer");
dotenv.config();

// // getInformationsOfDoctor,updateDoctor

module.exports = {
  //   //verifying doctor's identity
  //   doctorAuthentification: async (req, res) => {
  //     try {
  //       const doctor = {
  //         email: req.body.email,
  //         password: req.body.password
  //       }
  //       const doctorAuth = await db.Doctors.findOne({
  //         where:
  //         {
  //           email: req.body.email
  //         }
  //       }
  //       );
  //       const Match = bcrypt.compareSync(doctor.password, doctorAuth.dataValues.password);
  //       if (Match) {
  //         const token = jwt.sign( doctorAuth.dataValues, 'secret');
  //         res.cookie("auth", token);
  //         res.send({ message: 'welcome Back'})
  //       } else {
  //         res.send({ message: 'check the entries' });
  //       }
  //     }
  //     catch (err) {
  //         console.log(err)
  //       res.status(401).send(err)
  //     }
  //   },
  //    //method to add a post to the database via the respective model function.
  addDoctor: async (req, res) => {
    try {
      let activationCode = "";
      code=()=>{
      const characters =
        "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let i = 0; i <= 6; i++) {
        activationCode +=
          characters[Math.floor(Math.random() * characters.length)];
      }}
      const generation =await code()
      const newDoctor = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        phoneNumber: req.body.phoneNumber,
        licenseNumber: req.body.licenseNumber,
        adress: req.body.adress,
        disponibility: req.body.disponibility,
        image: req.body.image,
        activationCode: activationCode,
      };
      const Doctors = await db.Doctors.create(newDoctor);
      const nodemailer = await sendConfirmationMail(
        newDoctor.email,
        activationCode
      );

      res.status(203).json({ Doctors });
    } catch (error) {
      res.status(555).send(error);
    }
  },

  loginDoc: async (req, res) => {
    try {
      const doctor = {
        email: req.body.email,
        password: req.body.password,
      };

      const doctorAuth = await db.Doctors.findOne({
        where: {
          email: req.body.email,
        },
      });
      if (!doctorAuth) {
       return  res.status(404).send({ message: "user not found" });
      }
      const Match = bcrypt.compareSync(doctor.password, doctorAuth.password);
      if (!Match) {
        res.status(402).json({ message: "check the entries" });
      } else {
        const exp = Date.now() + 1000*60*60 ;
    const token = jwt.sign({ sub:doctorAuth.id, exp }, process.env.SECRET_KEY);
    res.cookie("Authorization", token, {
      expires: new Date(exp),
      httpOnly: true,
      sameSite: "lax"
    });
    const response = { message: "welcome Back", doctorAuth , token }
         res.status(202).json(response);
      }
    } catch (err) {
      console.log(err);
      return res.status(401).json("err");
    }
  },

  //   //method to update a post to the database via the respective model function.

  getOneDoc: async (req, res) => {
    try {
      // const doctor = {
      //   id: req.body.id
      // }
      // console.log(doctor);
      const doctorAuth = await db.Doctors.findOne({
        where: { id: req.body.id },
      });
      console.log(doctorAuth);
      res.status(202).json(doctorAuth);
    } catch (err) {
      console.log(err);
      res.status(401).send(err);
    }
  },
  updateDocProfile: async (req, res) => {
    try {
      const oneDoc = await db.Doctors.findOne({
        where: { id: req.body.id },
      });

      const doctor = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        licenseNumber: req.body.licenseNumber,
        adress: req.body.adress,
        disponibility: req.body.disponibility,
        image: req.body.image,
      };
      console.log("image", doctor.image);
      const doctorAuth = await db.Doctors.update(doctor, {
        where: { id: req.body.id },
      });
      const newDoc = await db.Doctors.findOne({
        where: { id: req.body.id },
      });

      console.log("aaaaaaaaaaaaaaaaaaaaa",doctorAuth)
      res.status(202).json(newDoc);
    } catch (err) {
      console.log(err);
      res.status(401).send(err);
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie("Authorization");
      return res.status(200).json({ message: "logged out" });
    } catch (err) {
      console.log(err);
      return res.status(401).json(err);
    }
  },
  verifyCode: async (req, res) => {
    try {
      //find one Doctor with his id as a filter
      let filter = { id: req.body.id };
      const Doctor = await db.Doctors.findOne({ where: filter });

      if (Doctor.activationCode === req.body.activationCode) {
        Doctor.confirmation = true;
        Doctor.save();
        return res.status(200).send("thank you for joining our app");
      }
      res.status(402).send("incorrect Code");
    } catch (error) {
      res.status(400).send(error);
    }
  },
};
