import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { ILike, Like, Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-category.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { MyRestaurantsOutput } from './dtos/my-restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
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
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
  ) {}

  private readonly PER_PAGE = 3;

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async myRestaurants(owner: User): Promise<MyRestaurantsOutput> {
    try {
      const restaurants = await this.restaurants.find({ owner });
      return { ok: true, restaurants };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
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

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [results, totalItems] = await this.restaurants.findAndCount({
        skip: (page - 1) * this.PER_PAGE,
        take: this.PER_PAGE,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        results,
        totalPages: Math.ceil(totalItems / this.PER_PAGE),
        totalItems,
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
      });
      if (!restaurant) {
        return { ok: false, error: 'Restaurant Not Found' };
      }
      return { ok: true, restaurant };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalItems] = await this.restaurants.findAndCount({
        where: {
          // name: ILike(`%${query}%`), // ILike : 대소문자를 모두 포함해서 검색할 때 사용
          name: Raw((name) => `${name} ILIKE '%${query}%'`),
        },
        skip: (page - 1) * this.PER_PAGE,
        take: this.PER_PAGE,
      });
      return {
        ok: true,
        restaurants,
        totalPages: Math.ceil(totalItems / this.PER_PAGE),
        totalItems,
      };
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
    try {
      const category = await this.categories.findOne(
        { slug },
        { relations: ['restaurants'] },
      );
      if (!category) {
        return { ok: false, error: 'Category Not Found' };
      }

      const results = await this.restaurants.find({
        where: {
          category,
        },
        take: this.PER_PAGE,
        skip: (page - 1) * this.PER_PAGE,
        order: {
          isPromoted: 'DESC',
        },
      });

      const totalItems = await this.countRestaurants(category);

      return {
        ok: true,
        category,
        results,
        totalPages: Math.ceil(totalItems / this.PER_PAGE),
        totalItems,
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId,
      );

      if (!restaurant) {
        return { ok: false, error: 'Restaurant not found' };
      }

      if (owner.id !== restaurant.ownerId) {
        return { ok: false, error: 'You are not the owner of this restaurant' };
      }

      const dish = await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );

      return { ok: true, dish };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const finded = await this.dishes.findOne(editDishInput.dishId, {
        relations: ['restaurant'],
      });
      if (!finded) {
        return { ok: false, error: 'Dish Not Found' };
      }
      if (finded.restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'You are not the owner of this restaurant' };
      }

      const dish = await this.dishes.save(
        this.dishes.create({
          id: editDishInput.dishId,
          ...editDishInput,
        }),
      );

      return { ok: true, dish };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }

  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      const dish = await this.dishes.findOne(dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return { ok: false, error: 'Dish Not Found' };
      }
      if (dish.restaurant.ownerId !== owner.id) {
        return { ok: false, error: 'You are not the owner of this restaurant' };
      }

      await this.dishes.delete(dishId);

      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }
}
