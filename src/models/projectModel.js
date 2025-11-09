// import Joi from "joi";
// import { GET_DB } from "../config/mongodb.js";
// // const Joi = require('joi');
// // const  {GET_DB} = require('../config/mongodb.js');
// const FEATURE_SECTION_COLLECTION_NAME='featureSection'; 
// const FEATURE_SECTION_COLLECTION_SCHEMA = Joi.object({
//     id: Joi.string().optional(),
//     title: Joi.string().required(),
//     shortDescription: Joi.string().required(),
//     fullDescription: Joi.string().required(),
//     isExpandable: Joi.boolean().default(false)
// })
// export const PROJECT_COLLECTION_NAME = 'project';
// export const PROJECT_COLLECTION_SCHEMA = Joi.object({
//     title: Joi.string().required().messages({
//         'string.empty': 'Title is required',
//         'any.required': 'Title is required'
//       }),
//       description: Joi.string().required().messages({
//         'string.empty': 'Description is required',
//         'any.required': 'Description is required'
//       }),
//       heroImage: Joi.string().uri().optional().allow(''),
//       gallery: Joi.array().items(Joi.string().uri()).optional(),
//       details: Joi.object({
//         area: Joi.string().optional().allow(''),
//         bedrooms: Joi.string().optional().allow(''),
//         bathrooms: Joi.string().optional().allow(''),
//         floors: Joi.string().optional().allow(''),
//         style: Joi.string().optional().allow(''),
//         year: Joi.string().optional().allow(''),
//         location: Joi.string().optional().allow('')
//       }).optional(),
//       floorPlans: Joi.array().items(Joi.string().uri()).optional(),
//       constructionProgress: Joi.array().items(Joi.string().uri()).optional(),
//       designImages: Joi.array().items(Joi.string().uri()).optional(),
//       brochure: Joi.string().uri().optional().allow(''),
//       featureSections: Joi.array().items(FEATURE_SECTION_COLLECTION_SCHEMA).optional()
// })

// const validation = async (projectData)=>
// {
//     return await PROJECT_COLLECTION_SCHEMA.validateAsync(projectData, {abortEarly:false, stripUnknown:true})
// }
// export const create = async (data)=>
// {
//   try 
//   {

//   }
//   catch(error)
//   {
//     throw error;
//   }
// }
// export const getProjects = async ()=>
// {
//   try 
//   {

//   }
//   catch(error)
//   {
//     throw error
//   }
// }
// // export default  {
// //     PROJECT_COLLECTION_NAME, 
// //     PROJECT_COLLECTION_SCHEMA, 
// //     create, 
// //     getProjects
// // }
// models/Project.js
import mongoose from 'mongoose';

const featureSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  shortDescription: String,
  fullDescription: String,
  isExpandable: { type: Boolean, default: true }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  location: String,
  
  // Images
  heroImage: String,
  gallery: [String],
  floorPlans: [String],
  constructionProgress: [String],
  designImages: [String],
  brochure:[String],
  // Details
  details: {
    area: String,
    bedrooms: String,
    bathrooms: String,
    floors: String,
    style: String,
    year: String,
    location: String
  },

  // Feature sections
  featureSections: [featureSectionSchema],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate slug before save
projectSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  this.updatedAt = Date.now();
  next();
});

export const Project = mongoose.model('Project', projectSchema);