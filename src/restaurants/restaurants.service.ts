import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-category.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    // Restaurant의 레포지토리를 inject
    // 그 이름은 restaurants이고, class는 Restaurant entity를 갖음 -> DB에 접근할 수 있다
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      // Restaurant 인스턴스 생성
      const newRestaurant = this.restaurants.create(createRestaurantInput); // create Instance
      newRestaurant.owner = owner; // owner는 현재 로그인한 사람

      // 상호명이 이미 존재할 경우
      const restaurant = await this.restaurants.findOne({
        name: newRestaurant.name,
      });
      if (restaurant) {
        return { ok: false, error: 'Restaurant already exists' };
      }

      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant); // save Instance to DB,
      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error: 'Could not create restaurant' };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        editRestaurantInput.restaurantId,
      );
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      if (owner.id !== restaurant.ownerId) {
        return { ok: false, error: 'You are not the owner of this restaurant' };
      }

      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      const updatedRestaurant = {
        id: editRestaurantInput.restaurantId,
        ...editRestaurantInput,
      };
      if (category) {
        updatedRestaurant['category'] = category;
      }

      await this.restaurants.save([updatedRestaurant]);

      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        deleteRestaurantInput.restaurantId,
      );
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }

      if (owner.id !== restaurant.ownerId) {
        return { ok: false, error: 'You are not the owner of this restaurant' };
      }

      await this.restaurants.delete(deleteRestaurantInput.restaurantId);

      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  /**
   * CategoryService
   */
  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return { ok: true, categories };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  countRestaurants(category: Category) {
    return this.restaurants.count({ category });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    const PER_PAGE = 5;
    try {
      const category = await this.categories.findOne(
        { slug },
        { relations: ['restaurants'] },
      );
      if (!category) {
        return { ok: false, error: 'Category Not Found' };
      }

      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        take: PER_PAGE,
        skip: (page - 1) * PER_PAGE,
      });

      category.restaurants = restaurants;
      const totalResults = await this.countRestaurants(category);

      return {
        ok: true,
        category,
        totalPages: Math.ceil(totalResults / PER_PAGE),
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }
}
