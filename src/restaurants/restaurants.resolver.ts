import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';

@Resolver()
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query(() => Restaurant)
  myRestaurant() {
    return true;
  }

  @Query(() => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }

  @Mutation(() => Boolean)
  async createRestaurant(
    @Args('input') createRestaurantDto: CreateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.createRestaurant(createRestaurantDto);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  @Mutation(() => Boolean)
  async updateRestaurant(
    @Args('input') updateRestaurantDto: UpdateRestaurantDto,
    // arg가 InputType이라면 @Args('something')에 이름을 작성해줘야하고, agr가 ArgsType이라면 @Args()에 아무 이름도 작성하지 않는다
  ): Promise<boolean> {
    try {
      console.log('update DTO : ', updateRestaurantDto);
      await this.restaurantService.updateRestaurant(updateRestaurantDto);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
