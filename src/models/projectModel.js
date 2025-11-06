import Joi from "joi";
import { GET_DB } from "../config/mongodb.js";
// const Joi = require('joi');
// const  {GET_DB} = require('../config/mongodb.js');
const FEATURE_SECTION_COLLECTION_NAME='featureSection'; 
const FEATURE_SECTION_COLLECTION_SCHEMA = Joi.object({
    id: Joi.string().optional(),
    title: Joi.string().required(),
    shortDescription: Joi.string().required(),
    fullDescription: Joi.string().required(),
    isExpandable: Joi.boolean().default(false)
})
const PROJECT_COLLECTION_NAME = 'project';
const PROJECT_COLLECTION_SCHEMA = Joi.object({
    title: Joi.string().required().messages({
        'string.empty': 'Title is required',
        'any.required': 'Title is required'
      }),
      description: Joi.string().required().messages({
        'string.empty': 'Description is required',
        'any.required': 'Description is required'
      }),
      heroImage: Joi.string().uri().optional().allow(''),
      gallery: Joi.array().items(Joi.string().uri()).optional(),
      details: Joi.object({
        area: Joi.string().optional().allow(''),
        bedrooms: Joi.string().optional().allow(''),
        bathrooms: Joi.string().optional().allow(''),
        floors: Joi.string().optional().allow(''),
        style: Joi.string().optional().allow(''),
        year: Joi.string().optional().allow(''),
        location: Joi.string().optional().allow('')
      }).optional(),
      floorPlans: Joi.array().items(Joi.string().uri()).optional(),
      constructionProgress: Joi.array().items(Joi.string().uri()).optional(),
      designImages: Joi.array().items(Joi.string().uri()).optional(),
      brochure: Joi.string().uri().optional().allow(''),
      featureSections: Joi.array().items(FEATURE_SECTION_COLLECTION_SCHEMA).optional()
})

const validation = async (projectData)=>
{
    return await PROJECT_COLLECTION_SCHEMA.validateAsync(projectData, {abortEarly:false, stripUnknown:true})
}
const create = async (data)=>
{
  try 
  {

  }
  catch(error)
  {
    throw error;
  }
}
const getProjects = async ()=>
{
  try 
  {

  }
  catch(error)
  {
    throw error
  }
}
export default  {
    PROJECT_COLLECTION_NAME, 
    PROJECT_COLLECTION_SCHEMA, 
    create, 
    getProjects
}