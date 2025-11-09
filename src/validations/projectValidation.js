// import Joi from "joi";
// import ApiError from "../utils/apiError.js";
// import { StatusCodes } from "http-status-codes";
// // const Joi = require('joi');
// // const ApiError = require('../utils/apiError.js');
// // const {StatusCodes} = require('http-status-codes');
// export const createProjectSchema = Joi.object({
//   title: Joi.string().required(),
//   description: Joi.string().required(),
//   heroImage: Joi.string().uri().allow(''),
//   gallery: Joi.array().items(Joi.string().uri()),
//   details: Joi.object({
//     area: Joi.string(),
//     bedrooms: Joi.string(),
//     bathrooms: Joi.string(),
//     floors: Joi.string(),
//     style: Joi.string(),
//     year: Joi.string(),
//     location: Joi.string()
//   }),
//   floorPlans: Joi.array().items(Joi.string().uri()),
//   constructionProgress: Joi.array().items(Joi.string().uri()),
//   designImages: Joi.array().items(Joi.string().uri()),
//   brochure: Joi.string().uri().allow(null),
//   featureSections: Joi.array().items(Joi.object({
//     id: Joi.string(),
//     title: Joi.string(),
//     shortDescription: Joi.string(),
//     fullDescription: Joi.string(),
//     isExpandable: Joi.boolean()
//   }))
// });

// // export createProjectSchema;
// validations/projectValidation.js
import Joi from 'joi';

export const PROJECT_CREATE_SCHEMA = Joi.object({
  title: Joi.string().required().min(1).max(255).messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title cannot exceed 255 characters'
  }),
  description: Joi.string().required().min(1).messages({
    'string.empty': 'Description is required'
  }),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  location: Joi.string().allow('').max(500),
  
  // Image fields (paths will be strings)
  heroImage: Joi.string().allow(''),
  gallery: Joi.array().items(Joi.string()),
  floorPlans: Joi.array().items(Joi.string()),
  constructionProgress: Joi.array().items(Joi.string()),
  designImages: Joi.array().items(Joi.string()),
  brochure: Joi.string().allow(''),

  // Details object
  details: Joi.object({
    area: Joi.string().allow(''),
    bedrooms: Joi.string().allow(''),
    bathrooms: Joi.string().allow(''),
    floors: Joi.string().allow(''),
    style: Joi.string().allow(''),
    year: Joi.string().allow(''),
    location: Joi.string().allow('')
  }).default({}),

  // Feature sections array
  featureSections: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      shortDescription: Joi.string().allow(''),
      fullDescription: Joi.string().allow(''),
      isExpandable: Joi.boolean().default(true)
    })
  ).default([])
});

export const PROJECT_UPDATE_SCHEMA = PROJECT_CREATE_SCHEMA.keys({
  title: Joi.string().min(1).max(255),
  description: Joi.string().min(1)
}).min(1); // At least one field required for update