// services/rentService.js
import Rent from '../models/rentModel.js';
import Amenity from '../models/AmenityModel.js';
import { deleteMultipleFromB2 } from '../config/b2.js';

class RentService {
  // GET ALL RENTALS WITH PAGINATION AND FILTERS
  async getAllRentals({ page = 1, limit = 10, search = '', status, featured }) {
    try {
      const skip = (page - 1) * limit;
      
      let query = {};
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        query.status = status;
      }
      
      if (featured !== undefined) {
        query.featured = featured === 'true';
      }
      
      const rentals = await Rent.find(query)
        .populate('amenities', 'name icon')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Rent.countDocuments(query);
      
      return {
        rentals,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // GET RENTAL BY ID
  async getRentalById(id) {
    try {
      const rental = await Rent.findById(id).populate('amenities', 'name icon');
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // CREATE NEW RENTAL
  async createRental(rentalData) {
    try {
      // Kiểm tra amenities tồn tại
      if (rentalData.amenities && Array.isArray(rentalData.amenities)) {
        const validAmenities = await Amenity.find({
          _id: { $in: rentalData.amenities }
        });
        rentalData.amenities = validAmenities.map(a => a._id);
      }
      
      const rental = new Rent(rentalData);
      await rental.save();
      await rental.populate('amenities', 'name icon');
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // UPDATE RENTAL
  async updateRental(id, rentalData) {
    try {
      const { newGalleryImages, ...updateData } = rentalData;
      
      // Kiểm tra amenities
      if (updateData.amenities && Array.isArray(updateData.amenities)) {
        const validAmenities = await Amenity.find({
          _id: { $in: updateData.amenities }
        });
        updateData.amenities = validAmenities.map(a => a._id);
      }
      
      if (newGalleryImages && newGalleryImages.length > 0) {
        const rental = await Rent.findById(id);
        if (rental) {
          rental.gallery = [...rental.gallery, ...newGalleryImages];
          await rental.save();
          await rental.populate('amenities', 'name icon');
          return rental;
        }
      }
      
      const rental = await Rent.findByIdAndUpdate(
        id,
        { 
          ...updateData,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      ).populate('amenities', 'name icon');
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // DELETE RENTAL
  async deleteRental(id) {
    try {
      const rental = await Rent.findById(id);
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      if (rental.gallery && rental.gallery.length > 0) {
        const keysToDelete = rental.gallery
          .filter(image => image.key)
          .map(image => image.key);
        
        if (keysToDelete.length > 0) {
          await deleteMultipleFromB2(keysToDelete);
          console.log(`🗑️ Deleted ${keysToDelete.length} rental images from B2`);
        }
      }
      
      await Rent.findByIdAndDelete(id);
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // UPLOAD RENTAL IMAGES
  async uploadRentalImages(id, newImages) {
    try {
      const rental = await Rent.findById(id);
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      rental.gallery = [...rental.gallery, ...newImages];
      
      if (!rental.featuredImage && newImages.length > 0) {
        rental.featuredImage = newImages[0].url;
        rental.gallery[0].isFeatured = true;
      }
      
      await rental.save();
      await rental.populate('amenities', 'name icon');
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // DELETE RENTAL IMAGE
  async deleteRentalImage(id, imageId) {
    try {
      const rental = await Rent.findById(id);
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      rental.gallery = rental.gallery.filter(img => img.id !== imageId);
      
      if (rental.featuredImage && rental.gallery.length > 0) {
        const featuredInGallery = rental.gallery.find(img => img.isFeatured);
        if (!featuredInGallery) {
          rental.gallery[0].isFeatured = true;
          rental.featuredImage = rental.gallery[0].url;
        }
      } else if (rental.gallery.length === 0) {
        rental.featuredImage = '';
      }
      
      await rental.save();
      await rental.populate('amenities', 'name icon');
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // SET FEATURED IMAGE
  async setFeaturedImage(id, imageId) {
    try {
      const rental = await Rent.findById(id);
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      const image = rental.gallery.find(img => img.id === imageId);
      
      if (!image) {
        throw new Error('Image not found in gallery');
      }
      
      rental.gallery.forEach(img => {
        img.isFeatured = false;
      });
      
      image.isFeatured = true;
      rental.featuredImage = image.url;
      
      await rental.save();
      await rental.populate('amenities', 'name icon');
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // UPDATE RENTAL STATUS
  async updateRentalStatus(id, status) {
    try {
      const rental = await Rent.findByIdAndUpdate(
        id,
        { 
          status,
          updatedAt: Date.now()
        },
        { new: true }
      ).populate('amenities', 'name icon');
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // TOGGLE FEATURED
  async toggleFeatured(id, featured) {
    try {
      const rental = await Rent.findByIdAndUpdate(
        id,
        { 
          featured: featured === true || featured === 'true',
          updatedAt: Date.now()
        },
        { new: true }
      ).populate('amenities', 'name icon');
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // AMENITY METHODS - Đơn giản hóa
  async getAllAmenities({ page = 1, limit = 100, search = '' }) {
    try {
      const skip = (page - 1) * limit;
      let query = {};
      
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      
      const amenities = await Amenity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Amenity.countDocuments(query);
      
      return {
        amenities,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async getAmenityById(id) {
    try {
      const amenity = await Amenity.findById(id);
      return amenity;
    } catch (error) {
      throw error;
    }
  }

  async createAmenity(amenityData) {
    try {
      const existingAmenity = await Amenity.findOne({ name: amenityData.name });
      if (existingAmenity) {
        throw new Error('Amenity already exists');
      }
      
      const amenity = new Amenity(amenityData);
      await amenity.save();
      return amenity;
    } catch (error) {
      throw error;
    }
  }

  async updateAmenity(id, amenityData) {
    try {
      if (amenityData.name) {
        const existingAmenity = await Amenity.findOne({ 
          name: amenityData.name, 
          _id: { $ne: id } 
        });
        if (existingAmenity) {
          throw new Error('Amenity name already exists');
        }
      }
      
      const amenity = await Amenity.findByIdAndUpdate(
        id,
        { ...amenityData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
      
      if (!amenity) {
        throw new Error('Amenity not found');
      }
      
      return amenity;
    } catch (error) {
      throw error;
    }
  }

  async deleteAmenity(id) {
    try {
      // Check if amenity is being used by any rental
      const usedInRentals = await Rent.findOne({ amenities: id });
      if (usedInRentals) {
        throw new Error('Cannot delete amenity that is being used by rentals');
      }
      
      const amenity = await Amenity.findByIdAndDelete(id);
      
      if (!amenity) {
        throw new Error('Amenity not found');
      }
      
      return amenity;
    } catch (error) {
      throw error;
    }
  }
}

export default new RentService();