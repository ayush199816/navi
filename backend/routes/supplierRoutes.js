const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById
} = require('../controllers/supplierController');

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);

module.exports = router;