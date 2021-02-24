import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
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

      if (!restaurant) return { ok: false, error: 'Restaurant Not Found' };
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error };
    }
  }
}
