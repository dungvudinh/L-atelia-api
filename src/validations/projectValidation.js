import Joi from "joi";
import ApiError from '~/utils/apiError.js';
import { StatusCodes } from "http-status-codes";
// const Joi = require('joi');
// const ApiError = require('../utils/apiError.js');
// const {StatusCodes} = require('http-status-codes');
const createProjectSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  heroImage: Joi.string().uri().allow(''),
  gallery: Joi.array().items(Joi.string().uri()),
  details: Joi.object({
    area: Joi.string(),
    bedrooms: Joi.string(),
    bathrooms: Joi.string(),
    floors: Joi.string(),
    style: Joi.string(),
    year: Joi.string(),
    location: Joi.string()
  }),
  floorPlans: Joi.array().items(Joi.string().uri()),
  constructionProgress: Joi.array().items(Joi.string().uri()),
  designImages: Joi.array().items(Joi.string().uri()),
  brochure: Joi.string().uri().allow(null),
  featureSections: Joi.array().items(Joi.object({
    id: Joi.string(),
    title: Joi.string(),
    shortDescription: Joi.string(),
    fullDescription: Joi.string(),
    isExpandable: Joi.boolean()
  }))
});

export default {createProjectSchema};