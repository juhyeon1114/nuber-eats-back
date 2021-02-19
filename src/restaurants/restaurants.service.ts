import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    // Restaurant의 레포지토리를 inject
    // 그 이름은 restaurants이고, class는 Restaurant entity를 갖음 -> DB에 접근할 수 있다
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  async createRestaurant(
    owner: User,
    CreateRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      // Restaurant 인스턴스 생성
      const newRestaurant = this.restaurants.create(CreateRestaurantInput); // create Instance
      newRestaurant.owner = owner; // owner는 현재 로그인한 사람

      // categoryName, categorySlug 생성
      const categoryName = CreateRestaurantInput.categoryName
        .replace(/  +/g, ' ')
        .trim()
        .toLowerCase();
      const categorySlug = categoryName.replace(/ /g, '-');

      // categorySlug가 이미 만들어져있는지 판단 후 Restaurant인스턴스에 추가
      let category = await this.categories.findOne({ slug: categorySlug });
      if (!category) {
        category = await this.categories.save(
          this.categories.create({ slug: categorySlug, name: categoryName }),
        );
      }
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
}
