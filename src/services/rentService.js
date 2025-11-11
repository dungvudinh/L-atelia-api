// services/rentService.js
import Rent from '../models/rentModel.js';

class RentService {
  // GET ALL RENTALS WITH PAGINATION AND FILTERS
  async getAllRentals({ page = 1, limit = 10, search = '', status, featured }) {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      let query = {};
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
          { 'contactInfo.address': { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        query.status = status;
      }
      
      if (featured !== undefined) {
        query.featured = featured === 'true';
      }
      
      const rentals = await Rent.find(query)
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
      const rental = await Rent.findById(id);
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // CREATE NEW RENTAL
  async createRental(rentalData) {
    try {
      const rental = new Rent(rentalData);
      await rental.save();
      return rental;
    } catch (error) {
      throw error;
    }
  }

  // UPDATE RENTAL
  async updateRental(id, rentalData) {
    try {
      const rental = await Rent.findByIdAndUpdate(
        id,
        { 
          ...rentalData,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      );
      
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
      const rental = await Rent.findByIdAndDelete(id);
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
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
      
      // Add new images to gallery
      rental.gallery = [...rental.gallery, ...newImages];
      
      // If no featured image is set, set the first image as featured
      if (!rental.featuredImage && newImages.length > 0) {
        rental.featuredImage = newImages[0].url;
        rental.gallery[0].isFeatured = true;
      }
      
      await rental.save();
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
      
      // Remove image from gallery
      rental.gallery = rental.gallery.filter(img => img.id !== imageId);
      
      // If deleted image was featured, set a new featured image
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
      
      // Find the image in gallery
      const image = rental.gallery.find(img => img.id === imageId);
      
      if (!image) {
        throw new Error('Image not found in gallery');
      }
      
      // Update all images to not featured
      rental.gallery.forEach(img => {
        img.isFeatured = false;
      });
      
      // Set the selected image as featured
      image.isFeatured = true;
      rental.featuredImage = image.url;
      
      await rental.save();
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
      );
      
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
      );
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      return rental;
    } catch (error) {
      throw error;
    }
  }
}

export default new RentService();